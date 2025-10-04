// main.js — Step 5: Leaflet + NASA GIBS + Annotations (localStorage)
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "🚀 Initializing Embiggen Viewer (Leaflet + NASA GIBS + Labels)..."
  );

  // Initialize map
  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
  });

  // NASA GIBS layer function
  function gibsTileUrl(layerName) {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/2025-09-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  }

  // Base layers
  const trueColor = L.tileLayer(
    gibsTileUrl("MODIS_Terra_CorrectedReflectance_TrueColor"),
    {
      attribution: "&copy; NASA GIBS",
      maxZoom: 9,
      tileSize: 256,
      noWrap: true,
    }
  ).addTo(map);

  const infrared = L.tileLayer(
    gibsTileUrl("MODIS_Terra_CorrectedReflectance_Bands367"),
    {
      attribution: "&copy; NASA GIBS",
      maxZoom: 9,
      tileSize: 256,
      noWrap: true,
    }
  );

  L.control
    .layers({
      "True Color (MODIS Terra)": trueColor,
      "Infrared (Bands 367)": infrared,
    })
    .addTo(map);

  L.control.scale().addTo(map);

  // --- Annotation system ---
  const STORAGE_KEY = "embiggen-annotations";
  let annotations = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  // Add saved markers on load
  annotations.forEach((a) => {
    const marker = L.marker([a.lat, a.lng]).addTo(map);
    marker.bindPopup(
      `<b>${a.label}</b><br>(${a.lat.toFixed(2)}, ${a.lng.toFixed(2)})`
    );
  });

  // On map click, prompt for label
  map.on("click", (e) => {
    const label = prompt("Enter a label for this location:");
    if (!label) return;

    const { lat, lng } = e.latlng;
    const marker = L.marker([lat, lng]).addTo(map);
    marker
      .bindPopup(`<b>${label}</b><br>(${lat.toFixed(2)}, ${lng.toFixed(2)})`)
      .openPopup();

    // Save to localStorage
    annotations.push({ label, lat, lng });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
    console.log("🧭 Saved annotation:", label);
  });

  console.log("✅ Embiggen Viewer with annotation system ready!");
});
