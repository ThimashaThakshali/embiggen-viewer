// main.js — Step 8A: improved comparison + correct marker layering
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Embiggen Viewer (final version)...");

  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
  });

  const layerName = "MODIS_Terra_CorrectedReflectance_TrueColor";
  const availableDates = [
    "2025-05-01",
    "2025-06-01",
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
  ];

  const makeLayer = (date, zIndex = 1, opacity = 1.0) =>
    L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      {
        attribution: "&copy; NASA GIBS",
        maxZoom: 9,
        tileSize: 256,
        noWrap: true,
        opacity,
        zIndex,
      }
    );

  // Base & comparison layers
  let baseDate = "2025-09-01";
  let compareDate = "2025-08-01";

  let baseLayer = makeLayer(baseDate, 1).addTo(map);
  let compareLayer = makeLayer(compareDate, 2, 1).addTo(map);

  // Date slider
  const slider = document.getElementById("dateSlider");
  const dateLabel = document.getElementById("selectedDate");

  slider.addEventListener("input", () => {
    baseDate = availableDates[slider.value];
    dateLabel.textContent = baseDate;
    map.removeLayer(baseLayer);
    baseLayer = makeLayer(baseDate, 1).addTo(map);
    console.log(`🕓 Base layer switched to ${baseDate}`);
  });

  // Opacity slider
  const opacitySlider = document.getElementById("opacitySlider");
  opacitySlider.addEventListener("input", () => {
    compareLayer.setOpacity(parseFloat(opacitySlider.value));
  });

  // Compare date dropdown
  const compareSelect = document.getElementById("compareSelect");
  compareSelect.addEventListener("change", () => {
    compareDate = compareSelect.value;
    map.removeLayer(compareLayer);
    compareLayer = makeLayer(
      compareDate,
      2,
      parseFloat(opacitySlider.value)
    ).addTo(map);
    console.log(`🔁 Comparing with ${compareDate}`);
  });

  // Fix marker z-index
  map.createPane("markers");
  map.getPane("markers").style.zIndex = 500;
  map.getPane("tilePane").style.zIndex = 200;
  map.getPane("overlayPane").style.zIndex = 300;

  // Annotations (persistent)
  const STORAGE_KEY = "embiggen-annotations";
  let annotations = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  annotations.forEach((a) => {
    const marker = L.marker([a.lat, a.lng], { pane: "markers" }).addTo(map);
    marker.bindPopup(
      `<b>${a.label}</b><br>(${a.lat.toFixed(2)}, ${a.lng.toFixed(2)})`
    );
  });

  map.on("click", (e) => {
    const label = prompt("Enter a label for this location:");
    if (!label) return;
    const { lat, lng } = e.latlng;
    const marker = L.marker([lat, lng], { pane: "markers" }).addTo(map);
    marker
      .bindPopup(`<b>${label}</b><br>(${lat.toFixed(2)}, ${lng.toFixed(2)})`)
      .openPopup();
    annotations.push({ label, lat, lng });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  });

  console.log("✅ Final comparison viewer ready!");
});
