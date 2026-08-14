import { useState } from "react";
import { Badge, type BadgeVariant } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { bootstrapSync, isFirebaseSyncConfigured } from "../../store/firebaseSync";
import type { SyncStatus } from "../../store/firebaseSync";

const STATUS_LABELS: Readonly<Record<SyncStatus, string>> = {
  disabled: "Nicht eingerichtet",
  connecting: "Verbinde …",
  waiting_for_bootstrap: "Verbunden, wartet auf ersten Sync",
  synced: "Synchronisiert",
  offline: "Offline – Änderungen werden nachgeliefert",
  error: "Verbindungsfehler",
};

const STATUS_VARIANTS: Readonly<Record<SyncStatus, BadgeVariant>> = {
  disabled: "neutral",
  connecting: "accent",
  waiting_for_bootstrap: "accent",
  synced: "win",
  offline: "loss",
  error: "loss",
};

export function AdminSync() {
  const status = useSyncStatus();
  const [uploading, setUploading] = useState(false);

  async function handleBootstrap() {
    const confirmed = confirm(
      "Diesen Turnierstand (dieses Gerät) als gemeinsamen Ausgangspunkt für alle Geräte hochladen? " +
        "Nur auf dem Gerät bestätigen, das gerade den echten, aktuellen Turnierstand hat.",
    );
    if (!confirmed) return;
    setUploading(true);
    await bootstrapSync();
    setUploading(false);
  }

  if (!isFirebaseSyncConfigured()) {
    return (
      <Card title="Cloud-Sync" subtitle="Ergebnisse geräteübergreifend anzeigen">
        <EmptyState message="Cloud-Sync ist für diese Championship noch nicht eingerichtet – die App läuft rein lokal (nur auf diesem Gerät/Browser sichtbar)." />
      </Card>
    );
  }

  return (
    <Card title="Cloud-Sync" subtitle="Ergebnisse geräteübergreifend anzeigen">
      <div style={{ marginBottom: 16 }}>
        <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      {status === "waiting_for_bootstrap" && (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 16 }}>
            Es gibt noch keinen gemeinsamen Turnierstand. Lade den aktuellen Stand <strong>dieses Geräts</strong> als
            Ausgangspunkt hoch – ab dann sehen alle Geräte, die diese Seite öffnen, automatisch dieselben Ergebnisse
            und jede neue Eingabe wird sofort auf allen Geräten sichtbar.
          </p>
          <Button variant="primary" onClick={handleBootstrap} disabled={uploading}>
            {uploading ? "Lädt hoch …" : "Diesen Turnierstand jetzt hochladen"}
          </Button>
        </>
      )}

      {status === "synced" && (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          Alle Geräte, die diese Championship öffnen, sehen automatisch denselben Turnierstand – Ergebnisse werden
          sofort übertragen.
        </p>
      )}

      {(status === "offline" || status === "error") && (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          Verbindung zum Sync-Dienst gerade nicht möglich. Eingaben auf diesem Gerät gehen nicht verloren (weiterhin
          lokal gespeichert) und werden automatisch nachgeliefert, sobald die Verbindung wieder da ist.
        </p>
      )}
    </Card>
  );
}
