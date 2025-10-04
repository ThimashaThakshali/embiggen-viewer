// main.js — Leaflet + NASA GIBS (replaces previous OpenSeadragon approach)

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Embiggen Viewer (Leaflet + NASA GIBS)...");

  // Create the map
  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 0,
    maxZoom: 9,
    worldCopyJump: true,
  });

  // NASA GIBS MODIS Terra True Color (EPSG:3857 - GoogleMapsCompatible tiles)
  const gibsUrl =
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/" +
    "MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-09-01/" +
    "GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";

  const gibsLayer = L.tileLayer(gibsUrl, {
    attribution: "&copy; NASA GIBS",
    maxZoom: 9,
    tileSize: 256,
    crossOrigin: true,
    keepBuffer: 2,
  });

  gibsLayer.addTo(map);

  // Basic UI controls
  L.control.scale().addTo(map);

  // Logging tile load errors
  gibsLayer.on("tileerror", function (e) {
    console.error("Tile error loading:", e);
  });

  // Confirm loaded by checking when one tile loads
  gibsLayer.on("tileload", function (e) {
    // Show success once (remove handler afterwards)
    console.log("✅ One tile loaded from NASA GIBS — layer is working.");
    gibsLayer.off("tileload"); // stop logging repeatedly
  });

  console.log(
    "✅ Leaflet map initialized. Open Network tab to see gibs requests."
  );
});
