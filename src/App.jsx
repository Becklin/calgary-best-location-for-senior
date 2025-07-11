import React, { useRef, useEffect } from "react";

import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";

import "@arcgis/map-components";
import { defineCustomElements } from "@esri/calcite-components/loader";
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/dist/loader";
import "@esri/calcite-components/dist/calcite/calcite.css";

import "./App.css";

defineCustomElements(window);
defineMapElements(window);

function App() {
  const searchRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const searchElm = searchRef.current;

    const map = new Map({
      basemap: "streets-navigation-vector",
    })

    const view = new MapView({
      container: mapRef.current,
      map,
      center: [-114.0719, 51.0447],
      zoom: 12,
    });

    view.when(() => {
      // 💡 將 view 傳給 arcgis-search 元件
      if (searchRef.current) {
        searchRef.current.view = view;
      }
    });

    const onSearchComplete = (e) => {
      const results = e.detail.results;
      if (results && results.length > 0) {
        const firstResult = results[0];
        const { latitude, longitude } = firstResult.results[0].extent.center;
        console.log(latitude, longitude);
      }
    }

    if (searchElm) {
      console.log("searchElm");
      searchElm.addEventListener("arcgisSearchComplete", onSearchComplete);
    }

    const hospitalsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/x34e-bcjz.geojson?$where=type='Hospital' OR type='PHS Clinic'",
      popupTemplate: {
        title: "{name}",  // 屬性名稱視 JSON 欄位而定
        content: `
          <b>Address:</b> {address}<br/>
          <b>Community:</b> {comm_code}<br/>
          <b>Type:</b> {type}
        `
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          style: "triangle",
          color: "#e74c3c",
          size: 10,
          outline: {
            color: "#ffffff",
            width: 1
          }
        }
      },
      copyright: "City of Calgary"
    });
    const parksLayer = new GeoJSONLayer({
      url: "/public/data/Parks Sites_20250711.geojson",
      popupTemplate: {
        title: "{site_name}",
        content: `<b>Type:</b> {PLANNING_CATEGORY}<br/>`
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [34, 139, 34, 0.3],
          style: "solid",
          outline: null,
        }
      },
      copyright: "City of Calgary"
    });
    const trainStationsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/2axz-xm4q.geojson",
      popupTemplate: {
        title: "{STATIONNAM}",
        content: `<b>Type:</b> {PLANNING_CATEGORY}<br/>`
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          style: "square",
          color: "#white",
          size: 10,
          outline: {
            color: "gray",
            width: 1
          }
        }
      },
      copyright: "City of Calgary"
    });
    map.add(hospitalsLayer);
    map.add(parksLayer);
    map.add(trainStationsLayer);

    return () => {
      searchElm?.removeEventListener("arcgisSearchComplete", onSearchComplete);
      view.destroy();
    };
  }, []);

  return (
    <>
    <div ref={mapRef}  style={{ height: "100vh", width: "100vw" }} ></div>
    <arcgis-search
      ref={searchRef}
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 10,
        width: "300px",
      }}
    ></arcgis-search>
    </>
  );
}

export default App;
