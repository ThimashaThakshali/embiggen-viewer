// main.js — Final Version with Filters + Clustering
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing Embiggen Viewer...");

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

  // --- Controls
  const slider = document.getElementById("dateSlider");
  const dateLabel = document.getElementById("selectedDate");
  const opacitySlider = document.getElementById("opacitySlider");
  const datasetSelect = document.getElementById("dataset");
  const modeSelect = document.getElementById("modeSelect");
  const showEventsCheckbox = document.getElementById("showEvents");
  const eventLimitInput = document.getElementById("eventLimit");
  const eventLimitValue = document.getElementById("eventLimitValue");
  const filterByBounds = document.getElementById("filterByBounds");

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

      if (type === "infrared") {
        options.maxNativeZoom = 8;
        options.maxZoom = 9;
      }
    } else if (dataset === "Moon") {
      url = DATASETS.Moon.base();
    } else if (dataset === "Mars") {
      url = DATASETS.Mars.base();
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

  let layers = {
    "True Color (MODIS Terra)": trueColor,
    "Infrared (Bands 367)": infrared,
  };
  let layerControl = L.control.layers(layers).addTo(map);

  // --- Date slider
  slider.addEventListener("input", () => {
    if (currentDataset !== "Earth") return;
    baseDate = availableDates[slider.value];
    dateLabel.textContent = baseDate;
    map.removeLayer(currentLayer);

    const isInfra = currentLayer._url.includes("Bands367");
    currentLayer = makeLayer(
      "Earth",
      isInfra ? "infrared" : "trueColor",
      baseDate
    ).addTo(map);
  });

  // --- Opacity slider
  opacitySlider.addEventListener("input", () => {
    if (topLayer) topLayer.setOpacity(parseFloat(opacitySlider.value));
  });

  // --- Sync top layer when base changes
  map.on("baselayerchange", (e) => {
    if (currentDataset !== "Earth") return;
    console.log("🛰️ Switched layer:", e.name);

    if (topLayer) map.removeLayer(topLayer);
    const useInfra = e.name.includes("Infrared");
    topLayer = makeLayer(
      "Earth",
      useInfra ? "infrared" : "trueColor",
      compareDate
    ).addTo(map);
    topLayer.setOpacity(parseFloat(opacitySlider.value));
    currentLayer = e.layer;
  });

  // --- Compare date dropdown
  const compareSelect = document.getElementById("compareSelect");
  compareSelect.addEventListener("change", () => {
    if (currentDataset !== "Earth") return;
    compareDate = compareSelect.value;

    if (topLayer) map.removeLayer(topLayer);
    const useInfra = currentLayer._url.includes("Bands367");
    topLayer = makeLayer(
      "Earth",
      useInfra ? "infrared" : "trueColor",
      compareDate
    ).addTo(map);
    topLayer.setOpacity(parseFloat(opacitySlider.value));

    console.log("🔁 Compare date changed:", compareDate);
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
      if (layerControl) map.removeControl(layerControl);
      layerControl = L.control.layers(layers).addTo(map);
    } else {
      currentLayer = makeLayer(currentDataset, "base").addTo(map);
      if (layerControl) map.removeControl(layerControl);
      topLayer = null;
    }

    console.log("🔄 Dataset switched:", currentDataset);
  });

  // --- Annotations (persistent)
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

  // --- NASA EONET Events
  let eventMarkers = L.markerClusterGroup();

  async function fetchEONETEvents(limit = 200, filterBounds = false) {
    try {
      const response = await fetch(
        "https://eonet.gsfc.nasa.gov/api/v3/events?status=open"
      );
      const data = await response.json();

      eventMarkers.clearLayers();

      let events = data.events.slice(0, limit);

      if (filterBounds) {
        const bounds = map.getBounds();
        events = events.filter((ev) => {
          if (!ev.geometry || !ev.geometry.length) return false;
          const [lon, lat] = ev.geometry[0].coordinates;
          return bounds.contains([lat, lon]);
        });
      }

      events.forEach((event) => {
        if (!event.geometry || !event.geometry.length) return;

        const [lon, lat] = event.geometry[0].coordinates;
        const marker = L.marker([lat, lon]).bindPopup(
          `<b>${event.title}</b><br>
           Category: ${event.categories[0].title}<br>
           <a href="${event.sources[0].url}" target="_blank">🔗 Details</a>`
        );
        eventMarkers.addLayer(marker);
      });

      map.addLayer(eventMarkers);
      console.log(`🌍 Loaded EONET events: ${events.length}`);
    } catch (err) {
      console.error("❌ Failed to fetch EONET events", err);
    }
  }

  // --- UI Events for EONET
  eventLimitInput.addEventListener("input", () => {
    eventLimitValue.textContent = eventLimitInput.value;
    if (showEventsCheckbox.checked)
      fetchEONETEvents(eventLimitInput.value, filterByBounds.checked);
  });

  filterByBounds.addEventListener("change", () => {
    if (showEventsCheckbox.checked)
      fetchEONETEvents(eventLimitInput.value, filterByBounds.checked);
  });

  showEventsCheckbox.addEventListener("change", () => {
    if (showEventsCheckbox.checked) {
      fetchEONETEvents(eventLimitInput.value, filterByBounds.checked);
    } else {
      eventMarkers.clearLayers();
      map.removeLayer(eventMarkers);
    }
  });

  console.log("✅ Viewer ready with datasets, modes, annotations, and events!");
});
