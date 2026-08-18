import { initializeApp, type FirebaseApp } from "firebase/app";
import { doc, getFirestore, onSnapshot, setDoc, type Firestore } from "firebase/firestore";
import { FIREBASE_CONFIG, isFirebaseConfigured } from "../lib/firebaseConfig";
import { normalizeIncomingMatches, useTournamentStore, type TournamentState } from "./useTournamentStore";

/**
 * Geräteübergreifender Cloud-Sync über ein einziges gemeinsames
 * Firestore-Dokument: alle Geräte, die dieselbe Championship öffnen,
 * lesen/schreiben denselben Turnierstand (Teams/Matches/Predictions).
 * Ohne gültige Firebase-Konfiguration (siehe lib/firebaseConfig.ts)
 * bleibt die App unverändert rein lokal – dieses Modul tut dann nichts.
 *
 * Bewusst KEIN automatischer Bootstrap beim ersten Laden: würde jedes
 * Gerät, das das (noch nicht existierende) Dokument zuerst sieht,
 * automatisch seinen eigenen lokalen Stand hochladen, könnte ein
 * leeres/frisches Gerät (z.B. ein Handy, das die App zum ersten Mal
 * öffnet) den echten, bereits laufenden Turnierstand eines anderen
 * Geräts überschreiben. Stattdessen muss der Sync einmalig explizit
 * über bootstrapSync() gestartet werden (siehe Adminbereich → Sync).
 */

const SYNC_COLLECTION = "bierpong-championship";
const SYNC_DOC_ID = "tournament";

export type SyncStatus =
  | "disabled"
  | "connecting"
  | "waiting_for_bootstrap"
  | "synced"
  | "offline"
  | "error";

let status: SyncStatus = "disabled";
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function isFirebaseSyncConfigured(): boolean {
  return isFirebaseConfigured();
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let remoteDocExists = false;
let applyingRemoteUpdate = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function tournamentDocRef() {
  if (!db) throw new Error("Firestore ist nicht initialisiert");
  return doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
}

function serialize(state: TournamentState): string {
  return JSON.stringify({ teams: state.teams, matches: state.matches, predictions: state.predictions });
}

async function pushNow(state: TournamentState): Promise<void> {
  if (!db) return;
  try {
    await setDoc(tournamentDocRef(), {
      teams: state.teams,
      matches: state.matches,
      predictions: state.predictions,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Firebase-Sync: Hochladen fehlgeschlagen", error);
    setStatus("offline");
  }
}

function schedulePush(state: TournamentState) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow(state);
  }, 400);
}

/**
 * Startet den Cloud-Sync (liest die aktuelle Firebase-Konfiguration, baut
 * die Verbindung auf und abonniert Live-Updates). Ohne Konfiguration
 * bleibt der Status "disabled" und es passiert nichts weiter. Wird genau
 * einmal beim App-Start aufgerufen (siehe main.tsx).
 */
export function initFirebaseSync(): void {
  if (initialized) return;
  initialized = true;

  if (!isFirebaseConfigured()) {
    setStatus("disabled");
    return;
  }

  setStatus("connecting");
  app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);

  onSnapshot(
    tournamentDocRef(),
    (snapshot) => {
      if (!snapshot.exists()) {
        remoteDocExists = false;
        setStatus("waiting_for_bootstrap");
        return;
      }

      remoteDocExists = true;
      const data = snapshot.data() as Partial<TournamentState>;
      if (!data.teams || !data.matches || !data.predictions) return;

      // Normalisieren, falls das geteilte Dokument noch von einer älteren
      // App-Version stammt (z.B. mit inzwischen obsoleten Rundenarten) –
      // ein veralteter Snapshot soll nicht ungefiltert übernommen werden.
      const normalized: TournamentState = {
        teams: data.teams,
        matches: normalizeIncomingMatches(data.matches),
        predictions: data.predictions,
      };

      const remoteSerialized = serialize(normalized);
      const localSerialized = serialize(useTournamentStore.getState());
      if (remoteSerialized !== localSerialized) {
        applyingRemoteUpdate = true;
        useTournamentStore.setState(normalized);
        applyingRemoteUpdate = false;
      }

      // Falls die Normalisierung den Snapshot inhaltlich verändert hat (z.B.
      // ein veraltetes gemeinsames Dokument mit obsoleten Rundenarten),
      // den bereinigten Stand direkt zurückschreiben, damit das geteilte
      // Dokument selbst dauerhaft sauber bleibt statt bei jedem Client
      // erneut normalisiert werden zu müssen.
      if (remoteSerialized !== serialize(data as TournamentState)) {
        void pushNow(normalized);
      }

      setStatus("synced");
    },
    (error) => {
      console.error("Firebase-Sync: Verbindung fehlgeschlagen", error);
      setStatus("error");
    },
  );

  useTournamentStore.subscribe((state) => {
    if (applyingRemoteUpdate || !remoteDocExists) return;
    schedulePush(state);
  });
}

/**
 * Einmaliger, expliziter Start des geteilten Turnierstands: lädt den
 * AKTUELLEN lokalen Stand dieses Geräts als gemeinsamen Ausgangspunkt
 * hoch. Nur auf dem Gerät mit dem echten, bereits laufenden Turnier
 * aufrufen – danach synchronisieren alle Geräte automatisch.
 */
export async function bootstrapSync(): Promise<void> {
  if (!db) return;
  await pushNow(useTournamentStore.getState());
  remoteDocExists = true;
  setStatus("synced");
}
