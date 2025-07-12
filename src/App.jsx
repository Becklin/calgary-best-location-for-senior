import React, { useRef, useEffect } from "react";

import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator.js";
import * as projection from "@arcgis/core/geometry/projection";

await projection.load();

import "@arcgis/map-components";
import { defineCustomElements } from "@esri/calcite-components/loader";
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/dist/loader";
import "@esri/calcite-components/dist/calcite/calcite.css";

import "./App.css";

defineCustomElements(window);
defineMapElements(window);


function App() {
  const [counts, setCounts] = React.useState({
    hospitals: 0,
    parks: 0,
    trainStations: 0,
  });
  const searchRef = useRef(null);
  const mapRef = useRef(null);

  let graphicsLayer = null;

  useEffect(() => {
    const hospitalsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/x34e-bcjz.geojson?$where=type='Hospital' OR type='PHS Clinic'",
      visible: false,
      popupTemplate: {
        title: "{name}",
        content: `
          <b>Address:</b> {address}<br/>
          <b>Community:</b> {comm_code}<br/>
          <b>Type:</b> {type}
        `,
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
            width: 1,
          },
        },
      },
      copyright: "City of Calgary",
    });
    const parksLayer = new GeoJSONLayer({
      url: "/public/data/Parks Sites_20250711.geojson",
      visible: false,
      popupTemplate: {
        title: "{site_name}",
        content: `<b>Type:</b> {PLANNING_CATEGORY}<br/>`,
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [34, 139, 34, 0.3],
          style: "solid",
          outline: null,
        },
      },
      copyright: "City of Calgary",
    });
    const trainStationsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/2axz-xm4q.geojson",
      visible: false,
      popupTemplate: {
        title: "{STATIONNAM}",
        content: `<b>Type:</b> {PLANNING_CATEGORY}<br/>`,
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
            width: 1,
          },
        },
      },
      copyright: "City of Calgary",
    });
    const searchElm = searchRef.current;

    const map = new Map({
      basemap: "gray-vector",
    });

    const view = new MapView({
      container: mapRef.current,
      spatialReference: { wkid: 102100 },
      map,
      center: [-114.0719, 51.0447],
      zoom: 12,
    });

    view.when(() => {
      if (searchRef.current) {
        searchRef.current.view = view;
      }
    });

    const onSearchComplete = async (e) => {
      if (graphicsLayer?.graphics?.length) graphicsLayer.removeAll();

      const results = e.detail.results;
      if (results && results.length > 0) {
        const firstResult = results[0];
        const point = firstResult.results[0].feature.geometry;
        let buffer = geometryEngine.buffer(point, 3000, "meters");
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: "blue",
            size: 8,
          },
        });

        const bufferGraphic = new Graphic({
          geometry: buffer,
          symbol: {
            type: "simple-fill",
            color: [0, 0, 255, 0.1],
            outline: {
              color: [0, 0, 255],
              width: 1,
            },
          },
        });

        graphicsLayer = new GraphicsLayer();
        graphicsLayer.addMany([bufferGraphic, pointGraphic]);

        const layers = [hospitalsLayer, parksLayer, trainStationsLayer];
        let servicesInBuffer = [];

        for (const layer of layers) {
          const features = await layer.queryFeatures();
          const filtered = features.features.filter(f => {
            if (
              f.geometry.spatialReference?.wkid !== buffer.spatialReference?.wkid
            ) {
              buffer = projection.project(buffer, f.geometry.spatialReference);
            }
            try {
              const result = intersectionOperator.execute(f.geometry, buffer);
              return result;
            } catch (err) {
              console.warn("No intersect", err);
              return false;
            }
          });

          servicesInBuffer.push(...filtered);
        }
        const featuresGraphics = servicesInBuffer.map((f) => {
          return new Graphic({
            geometry: f.geometry,
            attributes: f.attributes,
            popupTemplate: f.popupTemplate,
          });
        });

        graphicsLayer.addMany(featuresGraphics);
        map.add(graphicsLayer);
      }
    };

    if (searchElm) {
      searchElm.addEventListener("arcgisSearchComplete", onSearchComplete);
    }

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
      <div ref={mapRef} style={{ height: "100vh", width: "100vw" }}></div>
      <arcgis-search
        ref={searchRef}
        zoom-scale="15000"
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
