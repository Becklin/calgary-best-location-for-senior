import React from "react";

export default function LocationScoreWidget({ address, counts }) {
  if (!counts || Object.keys(counts).length === 0) {
    return <div style={{ padding: 16 }}>No data available</div>;
  }
  let score = 0;
  let overall = "";
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
    <calcite-panel
      heading="Search Results"
      collapsible="true"
      style={{
        width: "300px",
        padding: "12px",
        backgroundColor: "white",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        overflowY: "hidden",
      }}
    >
      <div style={{ width: "100%", backgroundColor: "white" }}>
        <h3>{address}</h3>
        <p>Hospital: {counts.hospitals} </p>
        <p>Park: {counts.parks} </p>
        <p>Train Station: {counts.trainStations} </p>
        <hr />
        <p style={{ fontWeight: "bold" }}>Overall Rating: {overall}</p>
      </div>
        <calcite-notice position="top-left" icon="information" kind="info" closable="true" scale="s" open>
          <div slot="title">Scoring Criteria</div>
          <div slot="message">
            This score is based on the number of hospitals, parks, and train stations,
            assuming they are beneficial for seniors. Please use as a reference only.
          </div>
        </calcite-notice>
    </calcite-panel>
  );
}
