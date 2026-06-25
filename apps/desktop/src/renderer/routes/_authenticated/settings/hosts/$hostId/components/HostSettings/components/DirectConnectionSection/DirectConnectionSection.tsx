import { Button } from "@superset/ui/button";
import { Input } from "@superset/ui/input";
import { Label } from "@superset/ui/label";
import { toast } from "@superset/ui/sonner";
import { useEffect, useState } from "react";
import { electronTrpc } from "renderer/lib/trpc";

interface DirectConnectionSectionProps {
	hostId: string;
	canEdit: boolean;
}

export function DirectConnectionSection({
	hostId,
	canEdit,
}: DirectConnectionSectionProps) {
	const { data: saved } = electronTrpc.settings.getDirectHostConnection.useQuery(
		{ hostId },
	);
	const setConnection = electronTrpc.settings.setDirectHostConnection.useMutation({
		onSuccess: () => toast.success("Direct connection saved"),
		onError: () => toast.error("Failed to save direct connection"),
	});

	const [url, setUrl] = useState("");
	const [secret, setSecret] = useState("");

	useEffect(() => {
		setUrl(saved?.url ?? "");
		setSecret(saved?.secret ?? "");
	}, [saved?.url, saved?.secret]);

	const isDirty =
		url !== (saved?.url ?? "") || secret !== (saved?.secret ?? "");

	const handleSave = () => {
		setConnection.mutate({
			hostId,
			url: url.trim() || null,
			secret: secret.trim() || null,
		});
	};

	const handleClear = () => {
		setUrl("");
		setSecret("");
		setConnection.mutate({ hostId, url: null, secret: null });
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
					on the host machine after running{" "}
					<code className="text-xs select-text cursor-text">
						HOST_SERVICE_HOSTNAME=0.0.0.0 superset start --daemon
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
						placeholder="http://100.x.x.x:32975"
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
				{saved?.url && (
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
