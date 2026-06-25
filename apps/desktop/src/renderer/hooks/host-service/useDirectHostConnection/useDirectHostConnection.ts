import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import {
	setHostServiceSecret,
} from "renderer/lib/host-service-auth";
import { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";

/**
 * Returns the direct host URL for a remote host if one is configured,
 * and registers the PSK so getHostServiceHeaders() picks it up automatically.
 * Returns null when hostId is null (local) or when no direct URL is stored.
 */
export function useDirectHostConnection(hostId: string | null): string | null {
	const collections = useCollections();

	const { data: hostRows = [] } = useLiveQuery(
		(q) =>
			q
				.from({ hosts: collections.v2Hosts })
				.where(({ hosts }) => eq(hosts.machineId, hostId ?? ""))
				.select(({ hosts }) => ({
					directHostUrl: hosts.directHostUrl,
					directHostSecret: hosts.directHostSecret,
				})),
		[collections, hostId],
	);

	const host = hostRows[0] ?? null;
	const directHostUrl = host?.directHostUrl ?? null;
	const directHostSecret = host?.directHostSecret ?? null;

	useEffect(() => {
		if (directHostUrl && directHostSecret) {
			setHostServiceSecret(directHostUrl, directHostSecret);
		}
	}, [directHostUrl, directHostSecret]);

	return directHostUrl;
}
