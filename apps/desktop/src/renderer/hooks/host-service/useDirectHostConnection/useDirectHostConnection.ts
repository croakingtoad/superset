import { useEffect } from "react";
import { electronTrpc } from "renderer/lib/trpc";
import {
	setHostServiceSecret,
} from "renderer/lib/host-service-auth";

/**
 * Returns the direct host URL for a remote host if one is configured locally,
 * and registers the PSK so getHostServiceHeaders() picks it up automatically.
 * Returns null when hostId is null (local) or when no direct URL is stored.
 */
export function useDirectHostConnection(hostId: string | null): string | null {
	const { data } = electronTrpc.settings.getDirectHostConnection.useQuery(
		{ hostId: hostId ?? "" },
		{ enabled: hostId !== null },
	);

	const directHostUrl = data?.url ?? null;
	const directHostSecret = data?.secret ?? null;

	useEffect(() => {
		if (directHostUrl && directHostSecret) {
			setHostServiceSecret(directHostUrl, directHostSecret);
		}
	}, [directHostUrl, directHostSecret]);

	return directHostUrl;
}
