// main.js — Step 6: Leaflet + NASA GIBS + Date Slider Comparison + Annotations
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Embiggen Viewer with time slider...");

  // Initialize map
  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
  });

  // --- NASA GIBS LAYER FUNCTION ---
  function gibsTileUrl(layerName, date) {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  }

  const layerName = "MODIS_Terra_CorrectedReflectance_TrueColor";

  // Available dates (you can expand this list)
  const availableDates = [
    "2025-05-01",
    "2025-06-01",
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
  ];

  // --- CURRENT LAYER ---
  let currentLayer = L.tileLayer(gibsTileUrl(layerName, availableDates[4]), {
    attribution: "&copy; NASA GIBS",
    maxZoom: 9,
    tileSize: 256,
    noWrap: true,
  }).addTo(map);

  // --- DATE SLIDER LOGIC ---
  const slider = document.getElementById("dateSlider");
  const dateLabel = document.getElementById("selectedDate");

  slider.addEventListener("input", () => {
    const date = availableDates[slider.value];
    dateLabel.textContent = date;

    // Remove current layer and load new one
    map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(gibsTileUrl(layerName, date), {
      attribution: "&copy; NASA GIBS",
      maxZoom: 9,
      tileSize: 256,
      noWrap: true,
    }).addTo(map);

    console.log(`🕓 Switched to date: ${date}`);
  });

  // --- SIMPLE ANNOTATION SYSTEM (from Step 5) ---
  const STORAGE_KEY = "embiggen-annotations";
  let annotations = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  annotations.forEach((a) => {
    const marker = L.marker([a.lat, a.lng]).addTo(map);
    marker.bindPopup(
      `<b>${a.label}</b><br>(${a.lat.toFixed(2)}, ${a.lng.toFixed(2)})`
    );
  });

  map.on("click", (e) => {
    const label = prompt("Enter a label for this location:");
    if (!label) return;

    const { lat, lng } = e.latlng;
    const marker = L.marker([lat, lng]).addTo(map);
    marker
      .bindPopup(`<b>${label}</b><br>(${lat.toFixed(2)}, ${lng.toFixed(2)})`)
      .openPopup();

    annotations.push({ label, lat, lng });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
    console.log("🧭 Saved annotation:", label);
  });

  console.log("✅ Time slider viewer ready!");
});
