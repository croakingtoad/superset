# Tailscale Direct Connect — Implementation Plan

**Branch**: `feat/tailscale-direct-connect`
**Status**: Implemented, pending migration generation + build

## Problem

The Superset desktop host-service binds only to `127.0.0.1`, and the remote
client always connects via Superset's paid relay WebSocket proxy. There is no
way to connect a remote desktop client directly to a host over a local network
(Tailscale).

## Solution

Two independent changes that compose:

### 1. Host-side bind address (`HOST_SERVICE_HOSTNAME` env var)

The host-service subprocess now reads `HOST_SERVICE_HOSTNAME` (default
`"127.0.0.1"`). Setting it to `0.0.0.0` (or a specific Tailscale IP) makes
the HTTP/WebSocket server reachable from the network.

**Changed files:**
- `apps/desktop/src/main/host-service/env.ts` — new zod field
- `apps/desktop/src/main/host-service/index.ts` — two `"127.0.0.1"` literals replaced

### 2. Client-side relay bypass

Two new nullable columns on `v2Hosts` store the direct URL and PSK per host.
When set, all three connection paths (WorkspaceProvider, useWorkspaceHostTarget,
useRemoteHostStatus) use the direct URL instead of the relay.

**Schema change** (`packages/db/src/schema/schema.ts`):
```
directHostUrl:    text("direct_host_url")    — e.g. "http://100.x.x.x:48123"
directHostSecret: text("direct_host_secret") — authToken from manifest.json
```

**New hook** (`apps/desktop/src/renderer/hooks/host-service/useDirectHostConnection/`):
- Queries `collections.v2Hosts` for the host's direct URL/secret
- Registers the PSK via `setHostServiceSecret()` on mount/change
- Returns the direct URL or null

**Connection paths updated** (all prefer direct URL, fall back to relay):
- `useWorkspaceHostUrl/useWorkspaceHostUrl.ts`
- `WorkspaceProvider/WorkspaceProvider.tsx`
- `hooks/useRemoteHostStatus/useRemoteHostStatus.ts`

**Optimistic action** (`useOptimisticCollectionActions.ts`):
- `actions.v2Hosts.updateDirectConnection(hostId, url, secret)`

**Settings UI** (`settings/hosts/$hostId/components/HostSettings/`):
- New `DirectConnectionSection` component — URL + auth token inputs
- Shown only for remote hosts, editable by owners only
- Wired into `HostSettings.tsx`

## Auth

No changes to auth logic. `PskHostAuthProvider` on the host already accepts
`Authorization: Bearer <psk>`. The `getHostServiceHeaders()` function already
branches on whether a PSK is registered for a given `hostUrl`. The only change
is that we now register the PSK for the direct URL rather than the relay URL.

## Pending steps

1. **Generate migration** (user must run):
   ```bash
   cd packages/db
   bunx drizzle-kit generate --name="add_direct_host_url"
   ```
   Per AGENTS.md, never manually edit `packages/db/drizzle/`.

2. **Build** — see below.

## End-to-end setup

**Host machine:**
```bash
export HOST_SERVICE_HOSTNAME=0.0.0.0   # or Tailscale IP
open /Applications/Superset.app
cat ~/.superset/host/<orgId>/manifest.json
# → { "endpoint": "http://0.0.0.0:48123", "authToken": "abc123..." }
```

**Remote client machine:**
1. Settings → Hosts → select the remote host
2. Direct Connection section:
   - Host URL: `http://100.x.x.x:48123` (Tailscale IP + port)
   - Auth token: `abc123...` (manifest `authToken`)
3. Save → connections now bypass relay entirely

## Merging upstream changes

When pulling upstream changes:
```bash
git fetch origin
git rebase origin/main
```

Likely conflict zones:
- `schema.ts` — if upstream touches `v2Hosts`, re-apply the two new column lines
- `useOptimisticCollectionActions.ts` — if upstream adds `v2Hosts` methods
- `WorkspaceProvider.tsx` / `useWorkspaceHostUrl.ts` — if upstream refactors
  the host URL resolution logic
