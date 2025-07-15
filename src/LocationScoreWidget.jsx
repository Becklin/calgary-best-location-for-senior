import React from "react";

export default function LocationScoreWidget({ counts }) {
    if (!counts || Object.keys(counts).length === 0) {
        return <div style={{ padding: 16 }}>No data available</div>;
    }
    let score = 0;
    let overall = '';
    if (counts.hospitals > 0) {
        score += 5;
    } else if (counts.parks > 3) {
        score += 2;
    } else if (counts.trainStations > 1) {
        score += 3;
    }
    if (score === 10) {
    overall = "Excellent";
    } else if (score >= 5 && score < 10) {
    overall = "Good";
    } else if (score >= 3 && score < 5) {
    overall = "Fair";
    } else if (score < 3) {
    overall = "Poor";
    }

  return (
    <div style={{ width: '100%', backgroundColor: 'white' }}>
      <h3>Result</h3>
      <p>Hospital: {counts.hospitals} </p>
      <p>Park: {counts.parks} </p>
      <p>Train Station: {counts.trainStations} </p>
      <hr />
      <p style={{ fontWeight: "bold" }}>Overall: {overall}</p>
    </div>
  );
}
