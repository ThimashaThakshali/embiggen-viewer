// main.js — Step 4 (stable Leaflet + NASA GIBS layer control, no wrap)
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "🚀 Initializing Embiggen Viewer (Leaflet + NASA GIBS Layers)..."
  );

  // Create the Leaflet map in the 'map' div
  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
    // continuousWorld false + noWrap on layers prevents duplication
  });

  // Template: GoogleMapsCompatible (EPSG:3857) — works well with Leaflet
  function gibsTileUrl(layerName) {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/2025-09-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  }

  // True Color (MODIS Terra)
  const trueColor = L.tileLayer(
    gibsTileUrl("MODIS_Terra_CorrectedReflectance_TrueColor"),
    {
      attribution: "&copy; NASA GIBS",
      maxZoom: 9,
      tileSize: 256,
      noWrap: true, // prevents horizontal tiling duplication
      continuousWorld: false,
      crossOrigin: true,
    }
  );

  // Infrared (example band combination)
  const infrared = L.tileLayer(
    gibsTileUrl("MODIS_Terra_CorrectedReflectance_Bands367"),
    {
      attribution: "&copy; NASA GIBS",
      maxZoom: 9,
      tileSize: 256,
      noWrap: true,
      continuousWorld: false,
      crossOrigin: true,
    }
  );

  // Add default (true color)
  trueColor.addTo(map);

  // Add layer control
  const baseMaps = {
    "True Color (MODIS Terra)": trueColor,
    "Infrared (Bands 367)": infrared,
  };
  L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);

  // Add scale
  L.control.scale().addTo(map);

  // Log tile loads and errors for debug/testing
  trueColor.on("tileload", (e) => {
    console.log("✅ TrueColor tile loaded (sample).");
    // remove handler after first tile to avoid spamming console
    trueColor.off("tileload");
  });
  trueColor.on("tileerror", (e) => {
    console.error("Tile error (TrueColor):", e);
  });

  infrared.on("tileload", (e) => {
    console.log("✅ Infrared tile loaded (sample).");
    infrared.off("tileload");
  });
  infrared.on("tileerror", (e) => {
    console.error("Tile error (Infrared):", e);
  });

  console.log(
    "✅ Leaflet map initialized. Open DevTools → Network to see gibs requests."
  );
});
