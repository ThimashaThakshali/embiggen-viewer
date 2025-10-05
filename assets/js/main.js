// main.js — Step 8D: Classic Leaflet Layer Control + Date + Opacity + Annotations
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing BloomWatch (Layer Control Mode)...");

  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
  });

  const availableDates = [
    "2025-05-01",
    "2025-06-01",
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
  ];

  const slider = document.getElementById("dateSlider");
  const dateLabel = document.getElementById("selectedDate");
  const opacitySlider = document.getElementById("opacitySlider");

  // --- Helper to build NASA GIBS tile layers
  const makeLayer = (layerName, date) =>
    L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      {
        attribution: "&copy; NASA GIBS",
        maxZoom: 9,
        tileSize: 256,
        noWrap: true,
      }
    );

  let baseDate = availableDates[4];
  let compareDate = availableDates[3];

  // --- Create both layers
  const trueColor = makeLayer(
    "MODIS_Terra_CorrectedReflectance_TrueColor",
    baseDate
  );
  const infrared = makeLayer("MODIS_Terra_Bands367", baseDate);

  // --- Default active layer
  let currentLayer = trueColor.addTo(map);
  let topLayer = makeLayer(
    "MODIS_Terra_CorrectedReflectance_TrueColor",
    compareDate
  ).addTo(map);

  // --- Leaflet layer control
  const layers = {
    "True Color (MODIS Terra)": trueColor,
    "Infrared (Bands 367)": infrared,
  };
  L.control.layers(layers).addTo(map);

  // --- Date slider
  slider.addEventListener("input", () => {
    baseDate = availableDates[slider.value];
    dateLabel.textContent = baseDate;
    map.removeLayer(currentLayer);
    currentLayer = makeLayer(
      currentLayer === trueColor
        ? "MODIS_Terra_CorrectedReflectance_TrueColor"
        : "MODIS_Terra_Bands367",
      baseDate
    ).addTo(map);
  });

  // --- Opacity slider
  opacitySlider.addEventListener("input", () => {
    topLayer.setOpacity(parseFloat(opacitySlider.value));
  });

  // --- Sync top layer when base changes
  map.on("baselayerchange", (e) => {
    console.log("🛰️ Switched layer:", e.name);
    map.removeLayer(topLayer);
    topLayer = makeLayer(
      e.name.includes("Infrared")
        ? "MODIS_Terra_Bands367"
        : "MODIS_Terra_CorrectedReflectance_TrueColor",
      compareDate
    ).addTo(map);
    topLayer.setOpacity(parseFloat(opacitySlider.value));
    currentLayer = e.layer;
  });

  // --- Persistent annotations
  const STORAGE_KEY = "bloomwatch-annotations";
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
  });

  console.log("✅ Classic layer control ready!");
});
