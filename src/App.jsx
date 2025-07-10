import React, { useRef, useEffect } from "react";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";
import Expand from "@arcgis/core/widgets/Expand";
import "@arcgis/map-components";

import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";

import "./App.css";

function App() {
  const mapDiv = useRef(null);

  useEffect(() => {
    if (mapDiv.current) {
      /**
       * Initialize application
       */
      const webmap = new WebMap({
        portalItem: {
          id: "aa1d3f80270146208328cf66d022e09c",
        },
      });

      const view = new MapView({
        container: mapDiv.current,
        map: webmap,
      });

    }
  }, [mapDiv]);

  return (
    <>
      <arcgis-search
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 99,
          width: 300,
          height: 30,
          backgroundColor: "white",
          padding: "5px",
          border: "1px solid #ccc",
        }}

      ></arcgis-search>
      <div className="mapDiv" ref={mapDiv}></div>
    </>
  );
}

export default App;
