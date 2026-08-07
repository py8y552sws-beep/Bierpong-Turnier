import { PageHeader } from "../components/common/PageHeader";
import { PredictionEditor } from "../components/predictions/PredictionEditor";
import { PREDICTION_POINTS_PER_CATEGORY } from "../constants/points";

export function Predictions() {
  return (
    <>
      <PageHeader
        title="Predictions"
        subtitle={`Jeder Spieler tippt vor Turnierbeginn in 10 Kategorien. Pro richtigem Tipp gibt es ${PREDICTION_POINTS_PER_CATEGORY} Punkte – nur komplett richtige Tipps zählen.`}
      />
      <PredictionEditor />
    </>
  );
}
