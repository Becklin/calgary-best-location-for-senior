import React, { useRef, useEffect } from "react";

import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator.js";
import * as projection from "@arcgis/core/geometry/projection";
await projection.load();

import "@arcgis/map-components";
import { defineCustomElements } from "@esri/calcite-components/loader";
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/dist/loader";
import "@esri/calcite-components/dist/calcite/calcite.css";

import LocationScoreWidget from "./LocationScoreWidget";
import "./App.css";

defineCustomElements(window);
defineMapElements(window);

function App() {
  const [counts, setCounts] = React.useState({
    hospitals: 0,
    parks: 0,
    trainStations: 0,
  });
  const [address, setAddress] = React.useState("");
  const [searched, setSearched] = React.useState(false);
  const searchRef = useRef(null);
  const mapRef = useRef(null);

  let graphicsLayer = null;

  useEffect(() => {
    const hospitalsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/x34e-bcjz.geojson?$where=type='Hospital' OR type='PHS Clinic'",
      visible: false,
      copyright: "City of Calgary",
    });
    const parksLayer = new GeoJSONLayer({
      url: "/data/Parks Sites_20250711.geojson",
      visible: false,
      copyright: "City of Calgary",
    });
    const trainStationsLayer = new GeoJSONLayer({
      url: "https://data.calgary.ca/resource/2axz-xm4q.geojson",
      visible: false,
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
      constraints: {
        minZoom: 10,
        maxZoom: 17,
        geometry: {
          type: "extent",
          spatialReference: { wkid: 4326 },
          xmin: -114.3,
          ymin: 50.8,
          xmax: -113.8,
          ymax: 51.2,
        },
      },
    });

    view.when(() => {
      if (searchRef.current) {
        searchRef.current.view = view;
      }
    });

    const onSearchComplete = async (e) => {
      if (graphicsLayer?.graphics?.length) graphicsLayer.removeAll();
      // copy the collection，avoid modifying the original collection
      const layersToRemove = map.layers.toArray().filter(layer => layer.type === "feature");
      if (layersToRemove.length > 0) {
        layersToRemove.forEach(layer => {
          map.remove(layer);
          layer.destroy();
        });
      }
      const results = e.detail.results;
      if (results && results.length > 0) {
        const firstResult = results[0];
        const point = firstResult.results[0].feature.geometry;
        const address = firstResult.results[0].name;
        let buffer = geometryEngine.buffer(point, 3000, "meters");

        const hospitalSymbol = {
          type: "simple-marker",
          style: "square",
          color: "#388eff",
          size: 16,
          outline: null,
        };
        const parkSymbol = {
          type: "simple-fill",
          color: [34, 139, 34, 0.3],
          style: "solid",
          outline: null,
        };
        const trainStationsSymbol = {
          type: "simple-marker",
          style: "square",
          color: "#692531",
          size: 8,
          outline: null,
        };

        const hospitalLabelClass = {
          labelExpressionInfo: { expression: "$feature.name" },
          symbol: {
            type: "text",
            color: "black",
            haloColor: "white",
            haloSize: "1px",
            font: {
              size: "12px",
              family: "sans-serif",
            },
          },
          labelPlacement: "above-center"
        };

        const parkLabelClass = {
          labelExpressionInfo: { expression: "$feature.name" },
          symbol: {
            type: "text",
            color: "black",
            haloColor: "white",
            haloSize: "1px",
            font: {
              size: "12px",
              family: "sans-serif",
            },
          },
          labelPlacement: "center-center"
        };


        const stationLabelClass = {
          labelExpressionInfo: { expression: "$feature.name" },
          symbol: {
            type: "text",
            color: "black",
            haloColor: "white",
            haloSize: "1px",
            font: {
              size: "12px",
              family: "sans-serif",
            },
          },
          labelPlacement: "above-center"
        };

        const layersWithStyles = {
          hospital: { layer: hospitalsLayer, labelClass: hospitalLabelClass, symbol: hospitalSymbol, counts: 0 },
          park: { layer: parksLayer, labelClass: parkLabelClass, symbol: parkSymbol, counts: 0 },
          trainStation: { layer: trainStationsLayer, labelClass: stationLabelClass, symbol: trainStationsSymbol, counts: 0 },
        };

        for (const key in layersWithStyles) {
          const { layer, symbol, labelClass } = layersWithStyles[key];
          const features = await layer.queryFeatures();
          const filtered = features.features.filter((f) => {
            const name = f.attributes.site_name ||
                  f.attributes.name ||
                  f.attributes.stationnam || "No Name";

            if (
              f.geometry.spatialReference?.wkid !==
              buffer.spatialReference?.wkid
            ) {
              buffer = projection.project(buffer, f.geometry.spatialReference);
            }
            try {
              return intersectionOperator.execute(f.geometry, buffer);
            } catch (err) {
              console.warn("No intersect", err);
              return false;
            }
          });

          layersWithStyles[key].counts = filtered.length;

          const graphicsInBuffer = filtered.map((f, index) => (new Graphic({
              geometry: f.geometry,
              attributes: {
                ...f.attributes,
                ObjectID: index,
                name:
                  f.attributes.site_name ||
                  f.attributes.name ||
                  f.attributes.stationnam || "No Name"
              },
              popupTemplate: f.popupTemplate,
            }))
          );

          const featurelayer = new FeatureLayer({
            source: graphicsInBuffer,
            objectIdField: "ObjectID",
            fields: [
              { name: "ObjectID", type: "oid" },
              { name: "name", alias: "Display Name", type: "string" },
            ],
            renderer: {
              type: "simple",
              symbol: symbol,
            },
            // labelingInfo: [labelClass],
            labelsVisible: true,
          });

          map.add(featurelayer);
        }
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: "gray",
            size: 4,
          },
          popupTemplate: {
            title: "Search Result",
            content: `
              <div>
                <h3>You searched for: <strong>${firstResult.results[0].name}</strong></h3>
                <p style="color: gray;">Hospitals: ${layersWithStyles.hospital.counts}</p>
                <p style="color: gray;">Parks: ${layersWithStyles.park.counts}</p>
                <p style="color: gray;">Train Stations: ${layersWithStyles.trainStation.counts}</p>
              </div>
            `,
          },
        });

        const bufferGraphic = new Graphic({
          geometry: buffer,
          symbol: {
            type: "simple-fill",
            color: [0, 255, 255, 0.2],
            outline: null,
          },
        });

        graphicsLayer = new GraphicsLayer();
        graphicsLayer.addMany([bufferGraphic, pointGraphic]);

        map.add(graphicsLayer);
        //override the default search view to the current map view
        searchRef.current.view.goTo({
          target: e.detail.results[0].results[0].feature.geometry,
          zoom: 13,
        });

        setCounts({
          hospitals: layersWithStyles.hospital.counts,
          parks: layersWithStyles.park.counts,
          trainStations: layersWithStyles.trainStation.counts,
        });
        setAddress(address);
        setSearched(true);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          gap: "10px",
        }}
      >
        <arcgis-search
          ref={searchRef}
          popupDisabled="true"
          label="Search for a location"
          style={{
            width: "300px",
          }}
        ></arcgis-search>
        {searched && <LocationScoreWidget address={address} counts={counts} />}
      </div>
    </>
  );
}

export default App;
