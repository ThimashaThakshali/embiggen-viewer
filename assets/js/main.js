// main.js — Step 9: Dataset Selector + Layer Control + Date + Opacity + Annotations
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Embiggen Your Eyes with dataset selector...");

  const map = L.map("map", {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 9,
    worldCopyJump: false,
  });

  // --- Dataset configs with WMTS/Tile URLs
  const DATASETS = {
    Earth: {
      trueColor: (date) =>
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      infrared: (date) =>
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Bands367/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      maxZoom: 9,
    },
    Moon: {
      base: () =>
        `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd/{z}/{x}/{y}.jpg`,
      maxZoom: 7,
    },
    Mars: {
      base: () =>
        `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ColorHillshade_Global_463m/{z}/{x}/{y}.jpg`,
      maxZoom: 7,
    },
  };

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
  const datasetSelect = document.getElementById("dataset");

  // --- Helper to build NASA/trek layers
  function makeLayer(dataset, type, date) {
    let url = "";
    let maxZoom = DATASETS[dataset].maxZoom;

    if (dataset === "Earth") {
      url =
        type === "infrared"
          ? DATASETS.Earth.infrared(date)
          : DATASETS.Earth.trueColor(date);
    } else if (dataset === "Moon") {
      url = DATASETS.Moon.base();
    } else if (dataset === "Mars") {
      url = DATASETS.Mars.base();
    }

    return L.tileLayer(url, {
      attribution: "&copy; NASA GIBS & Solar System Treks",
      maxZoom: maxZoom,
      tileSize: 256,
      noWrap: true,
    });
  }

  let baseDate = availableDates[4];
  let compareDate = availableDates[3];
  let currentDataset = "Earth";

  // --- Initial Earth layers
  let trueColor = makeLayer("Earth", "trueColor", baseDate);
  let infrared = makeLayer("Earth", "infrared", baseDate);

  let currentLayer = trueColor.addTo(map);
  let topLayer = makeLayer("Earth", "trueColor", compareDate).addTo(map);

  // --- Leaflet layer control (only for Earth dataset)
  let layers = {
    "True Color (MODIS Terra)": trueColor,
    "Infrared (Bands 367)": infrared,
  };
  let layerControl = L.control.layers(layers).addTo(map);

  // --- Date slider
  slider.addEventListener("input", () => {
    if (currentDataset !== "Earth") return; // only Earth has time series
    baseDate = availableDates[slider.value];
    dateLabel.textContent = baseDate;
    map.removeLayer(currentLayer);

    if (currentLayer === infrared) {
      currentLayer = makeLayer("Earth", "infrared", baseDate).addTo(map);
    } else {
      currentLayer = makeLayer("Earth", "trueColor", baseDate).addTo(map);
    }
  });

  // --- Opacity slider
  opacitySlider.addEventListener("input", () => {
    if (topLayer) {
      topLayer.setOpacity(parseFloat(opacitySlider.value));
    }
  });

  // --- Sync top layer when base changes (only for Earth)
  map.on("baselayerchange", (e) => {
    if (currentDataset !== "Earth") return;
    console.log("🛰️ Switched layer:", e.name);
    map.removeLayer(topLayer);
    topLayer = makeLayer(
      "Earth",
      e.name.includes("Infrared") ? "infrared" : "trueColor",
      compareDate
    ).addTo(map);
    topLayer.setOpacity(parseFloat(opacitySlider.value));
    currentLayer = e.layer;
  });

  // --- Dataset switch
  datasetSelect.addEventListener("change", () => {
    currentDataset = datasetSelect.value;
    map.eachLayer((layer) => map.removeLayer(layer)); // Clear map

    if (currentDataset === "Earth") {
      trueColor = makeLayer("Earth", "trueColor", baseDate);
      infrared = makeLayer("Earth", "infrared", baseDate);
      currentLayer = trueColor.addTo(map);
      topLayer = makeLayer("Earth", "trueColor", compareDate).addTo(map);

      layers = {
        "True Color (MODIS Terra)": trueColor,
        "Infrared (Bands 367)": infrared,
      };
      layerControl = L.control.layers(layers).addTo(map);
    } else {
      currentLayer = makeLayer(currentDataset, "base").addTo(map);
      // remove Earth-specific layer control
      if (layerControl) {
        map.removeControl(layerControl);
      }
      topLayer = null; // no comparison layer for Moon/Mars
    }

    console.log("🔄 Dataset switched to:", currentDataset);
  });

  // --- Persistent annotations
  const STORAGE_KEY = "embiggen-your-eyes-annotations";
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

  console.log("✅ Classic layer control + dataset selector ready!");
});
