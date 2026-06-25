import { Button } from "@superset/ui/button";
import { Input } from "@superset/ui/input";
import { Label } from "@superset/ui/label";
import { toast } from "@superset/ui/sonner";
import { useEffect, useState } from "react";
import { useOptimisticCollectionActions } from "renderer/routes/_authenticated/hooks/useOptimisticCollectionActions";

interface DirectConnectionSectionProps {
	hostId: string;
	currentDirectHostUrl: string | null;
	currentDirectHostSecret: string | null;
	canEdit: boolean;
}

export function DirectConnectionSection({
	hostId,
	currentDirectHostUrl,
	currentDirectHostSecret,
	canEdit,
}: DirectConnectionSectionProps) {
	const actions = useOptimisticCollectionActions();
	const [url, setUrl] = useState(currentDirectHostUrl ?? "");
	const [secret, setSecret] = useState(currentDirectHostSecret ?? "");

	useEffect(() => {
		setUrl(currentDirectHostUrl ?? "");
		setSecret(currentDirectHostSecret ?? "");
	}, [currentDirectHostUrl, currentDirectHostSecret]);

	const isDirty =
		url !== (currentDirectHostUrl ?? "") ||
		secret !== (currentDirectHostSecret ?? "");

	const handleSave = () => {
		const trimmedUrl = url.trim();
		const trimmedSecret = secret.trim();
		const tx = actions.v2Hosts.updateDirectConnection(
			hostId,
			trimmedUrl || null,
			trimmedSecret || null,
		);
		tx?.isPersisted.promise.then(
			() => toast.success("Direct connection saved"),
			() => {},
		);
	};

	const handleClear = () => {
		setUrl("");
		setSecret("");
		const tx = actions.v2Hosts.updateDirectConnection(hostId, null, null);
		tx?.isPersisted.promise.then(
			() => toast.success("Direct connection cleared"),
			() => {},
		);
	};

	return (
		<section className="space-y-3">
			<div>
				<h3 className="text-sm font-medium">Direct Connection</h3>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Connect over Tailscale without the relay. Get these values from{" "}
					<code className="text-xs select-text cursor-text">
						~/.superset/host/&lt;orgId&gt;/manifest.json
					</code>{" "}
					on the host machine after setting{" "}
					<code className="text-xs select-text cursor-text">
						HOST_SERVICE_HOSTNAME=0.0.0.0
					</code>
					.
				</p>
			</div>

			<div className="space-y-2">
				<div className="space-y-1.5">
					<Label htmlFor="direct-host-url" className="text-xs">
						Host URL
					</Label>
					<Input
						id="direct-host-url"
						placeholder="http://100.x.x.x:48123"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						disabled={!canEdit}
						className="font-mono text-sm"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="direct-host-secret" className="text-xs">
						Auth token
					</Label>
					<Input
						id="direct-host-secret"
						type="password"
						placeholder="authToken from manifest.json"
						value={secret}
						onChange={(e) => setSecret(e.target.value)}
						disabled={!canEdit}
						className="font-mono text-sm"
					/>
				</div>
			</div>

			<div className="flex gap-2">
				<Button
					size="sm"
					onClick={handleSave}
					disabled={!canEdit || !isDirty || !url.trim() || !secret.trim()}
				>
					Save
				</Button>
				{currentDirectHostUrl && (
					<Button
						size="sm"
						variant="outline"
						onClick={handleClear}
						disabled={!canEdit}
					>
						Clear
					</Button>
				)}
			</div>

			{!canEdit && (
				<p className="text-xs text-muted-foreground">
					Only host owners can configure direct connections.
				</p>
			)}
		</section>
	);
}
