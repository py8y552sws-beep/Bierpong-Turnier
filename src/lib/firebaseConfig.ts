/**
 * Firebase-Projektkonfiguration für den geräteübergreifenden Cloud-Sync
 * der Turnierdaten (Teams/Matches/Predictions). Diese Werte sind bei
 * Firebase-Web-Apps NICHT geheim – Zugriffsschutz läuft über die
 * Firestore Security Rules im Firebase-Projekt, nicht über Geheimhaltung
 * dieser Konfiguration – und dürfen daher unbedenklich im Repository
 * liegen.
 *
 * Solange die Felder leer sind, läuft die App unverändert rein lokal
 * (localStorage über zustand/persist, wie bisher) – kein Absturz, kein
 * Sync-Versuch. Erst wenn hier ein echtes Firebase-Projekt eingetragen
 * ist, aktiviert sich der Cloud-Sync automatisch (siehe store/firebaseSync.ts).
 */
export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export function isFirebaseConfigured(): boolean {
  return Object.values(FIREBASE_CONFIG).every((value) => value.trim().length > 0);
}
