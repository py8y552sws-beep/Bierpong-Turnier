import { useSyncExternalStore } from "react";
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from "../store/firebaseSync";

/** Reaktiver Zugriff auf den aktuellen Cloud-Sync-Status (siehe store/firebaseSync.ts). */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus);
}
