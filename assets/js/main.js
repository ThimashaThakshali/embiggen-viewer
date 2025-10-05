// main.js — Step 9–11: Dataset Selector + Layers + Date + Opacity + Annotations + EONET Events
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
        `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/250m/{z}/{y}/{x}.jpg`,

      infrared: (date) =>
        `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_Bands367/default/${date}/250m/{z}/{y}/{x}.jpg`,

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
  const modeSelect = document.getElementById("modeSelect");
  const showEventsCheckbox = document.getElementById("showEvents");

  // --- Helper to build NASA/trek layers
  function makeLayer(dataset, type, date) {
    let url = "";
    let maxZoom = DATASETS[dataset].maxZoom;
    let options = {
      attribution: "&copy; NASA GIBS & Solar System Treks",
      maxZoom: maxZoom,
      tileSize: 256,
      noWrap: true,
    };

    if (dataset === "Earth") {
      url =
        type === "infrared"
          ? DATASETS.Earth.infrared(date)
          : DATASETS.Earth.trueColor(date);

      // Infrared native tiles only go to level 8 — tell Leaflet to use level 8 as native
      if (type === "infrared") {
        options.maxNativeZoom = 8; // use level-8 tiles when zoomed further
        options.maxZoom = 9; // keep options.maxZoom = 9 so map can zoom to 9 (tiles will be upscaled)
      }
    } else if (dataset === "Moon") {
      url = DATASETS.Moon.base();
      options.bounds = [
        [-90, -180],
        [90, 180],
      ];
    } else if (dataset === "Mars") {
      url = DATASETS.Mars.base();
      options.bounds = [
        [-90, -180],
        [90, 180],
      ];
    }

    return L.tileLayer(url, options);
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

  // --- Load leaflet-side-by-side (browser UMD build) and wait for it to be ready
  let sideBySideReady = false;
  const sideBySideScript = document.createElement("script");
  // Use the browser-friendly minified UMD file (do not load package root)
  sideBySideScript.src =
    "https://unpkg.com/leaflet-side-by-side@2.0.1/leaflet-side-by-side.min.js";
  sideBySideScript.crossOrigin = "";
  sideBySideScript.onload = () => {
    sideBySideReady = true;
    console.log("✅ leaflet-side-by-side loaded (ready).");
  };
  sideBySideScript.onerror = (e) => {
    console.warn(
      "⚠️ Failed to load leaflet-side-by-side plugin. Swipe mode will be unavailable.",
      e
    );
  };
  document.head.appendChild(sideBySideScript);

  // --- Date slider
  slider.addEventListener("input", () => {
    if (currentDataset !== "Earth") return;
    baseDate = availableDates[slider.value];
    dateLabel.textContent = baseDate;
    map.removeLayer(currentLayer);

    // Note: comparing by object equality can be brittle if layer instances are re-created.
    // We conservatively try to recreate the same *type* of layer as currently selected.
    // If the active layer name exists in layer control, we can check via its tile URL,
    // but for simplicity we check pixel approximations:
    if (currentLayer && currentLayer.getTileUrl) {
      // crude check: if URL contains "Bands367" treat as infrared else trueColor
      const tmpUrl = currentLayer._url || "";
      if (tmpUrl.includes("Bands367")) {
        currentLayer = makeLayer("Earth", "infrared", baseDate).addTo(map);
      } else {
        currentLayer = makeLayer("Earth", "trueColor", baseDate).addTo(map);
      }
    } else {
      // fallback: default to trueColor
      currentLayer = makeLayer("Earth", "trueColor", baseDate).addTo(map);
    }
  });

  // --- Opacity slider
  opacitySlider.addEventListener("input", () => {
    if (topLayer) {
      topLayer.setOpacity(parseFloat(opacitySlider.value));
    }
  });

  // --- Sync top layer when base changes
  map.on("baselayerchange", (e) => {
    if (currentDataset !== "Earth") return;
    console.log("🛰️ Switched layer:", e.name);
    if (topLayer) map.removeLayer(topLayer);

    const useInfra = e.name && e.name.includes("Infrared");
    topLayer = makeLayer(
      "Earth",
      useInfra ? "infrared" : "trueColor",
      compareDate
    ).addTo(map);
    if (topLayer && topLayer.setOpacity)
      topLayer.setOpacity(parseFloat(opacitySlider.value));
    currentLayer = e.layer;
  });

  // --- Compare date dropdown
  const compareSelect = document.getElementById("compareSelect");
  compareSelect.addEventListener("change", () => {
    if (currentDataset !== "Earth") return;
    compareDate = compareSelect.value;

    if (topLayer) {
      map.removeLayer(topLayer);
    }

    const useInfra =
      currentLayer &&
      currentLayer._url &&
      currentLayer._url.includes("Bands367");

    topLayer = makeLayer(
      "Earth",
      useInfra ? "infrared" : "trueColor",
      compareDate
    ).addTo(map);

    if (topLayer && topLayer.setOpacity) {
      topLayer.setOpacity(parseFloat(opacitySlider.value));
    }

    console.log("🔁 Compare date changed to:", compareDate);
  });

  // --- Dataset switch
  datasetSelect.addEventListener("change", () => {
    currentDataset = datasetSelect.value;
    map.eachLayer((layer) => map.removeLayer(layer));

    if (currentDataset === "Earth") {
      trueColor = makeLayer("Earth", "trueColor", baseDate);
      infrared = makeLayer("Earth", "infrared", baseDate);
      currentLayer = trueColor.addTo(map);
      topLayer = makeLayer("Earth", "trueColor", compareDate).addTo(map);

      layers = {
        "True Color (MODIS Terra)": trueColor,
        "Infrared (Bands 367)": infrared,
      };
      // re-add layer control
      if (layerControl) {
        try {
          map.removeControl(layerControl);
        } catch (e) {}
      }
      layerControl = L.control.layers(layers).addTo(map);
    } else {
      currentLayer = makeLayer(currentDataset, "base").addTo(map);
      if (layerControl) {
        try {
          map.removeControl(layerControl);
        } catch (e) {}
      }
      topLayer = null;
    }

    console.log("🔄 Dataset switched to:", currentDataset);
  });

  let sideBySideControl = null;
  modeSelect.addEventListener("change", () => {
    const mode = modeSelect.value;
    // Clear existing compare mode
    if (sideBySideControl) {
      try {
        map.removeControl(sideBySideControl);
      } catch (e) {}
      sideBySideControl = null;
    }
    if (topLayer) {
      try {
        map.removeLayer(topLayer);
      } catch (e) {}
    }

    if (mode === "opacity") {
      if (currentDataset === "Earth") {
        topLayer = makeLayer("Earth", "trueColor", compareDate).addTo(map);
        if (topLayer && topLayer.setOpacity)
          topLayer.setOpacity(parseFloat(opacitySlider.value));
      }
      console.log("🌓 Using opacity mode");
    } else if (mode === "swipe") {
      if (currentDataset === "Earth") {
        if (!sideBySideReady || typeof L.control.sideBySide !== "function") {
          alert("Swipe plugin not ready yet — please try again in a moment.");
          modeSelect.value = "opacity";
          return;
        }
        let leftLayer = makeLayer("Earth", "trueColor", baseDate).addTo(map);
        let rightLayer = makeLayer("Earth", "trueColor", compareDate).addTo(
          map
        );
        sideBySideControl = L.control
          .sideBySide(leftLayer, rightLayer)
          .addTo(map);
        currentLayer = leftLayer;
        topLayer = rightLayer;
      } else {
        alert("Swipe mode is only supported for Earth dataset.");
        modeSelect.value = "opacity";
      }
      console.log("🔀 Using swipe mode");
    }
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

  // --- ✅ NASA EONET Events (inside DOMContentLoaded)
  let eventMarkers = L.layerGroup().addTo(map);

  async function fetchEONETEvents() {
    try {
      const response = await fetch(
        "https://eonet.gsfc.nasa.gov/api/v3/events?status=open"
      );
      const data = await response.json();

      eventMarkers.clearLayers();

      data.events.forEach((event) => {
        if (!event.geometry || !event.geometry.length) return;

        const { coordinates } = event.geometry[0];
        const [lon, lat] = coordinates;

        const marker = L.marker([lat, lon]).bindPopup(
          `<b>${event.title}</b><br>
           Category: ${event.categories[0].title}<br>
           <a href="${event.sources[0].url}" target="_blank">🔗 Details</a>`
        );
        eventMarkers.addLayer(marker);
      });

      console.log("🌍 Loaded EONET events:", data.events.length);
    } catch (err) {
      console.error("❌ Failed to fetch EONET events", err);
    }
  }

  showEventsCheckbox.addEventListener("change", () => {
    if (showEventsCheckbox.checked) {
      fetchEONETEvents();
      map.addLayer(eventMarkers);
    } else {
      eventMarkers.clearLayers();
      map.removeLayer(eventMarkers);
    }
  });

  console.log("✅ Viewer ready with datasets, modes, annotations, and events!");
});
