// ==========================================================================
// RAUM LOGIX TMS - CORE INTERACTIVE ENGINE
// ==========================================================================

// Global State
let map;
let activeTelemetryTripId = 'TR-101';
let telemetryChartInterval;
let logInterval;
let truckMovementInterval;
let sensorDataPoints = [4.2, 4.0, 3.8, 3.9, 4.1, 3.8, 3.7, 3.8, 3.9, 3.8]; // Refrigerator temp history

// Initial Seed Data
const cities = {
  kyiv: [50.4501, 30.5234],
  lviv: [49.8397, 24.0297],
  warsaw: [52.2297, 21.0122],
  berlin: [52.5200, 13.4050],
  odessa: [46.4825, 30.7233],
  constanta: [44.1792, 28.6498],
  dnipro: [48.4647, 35.0462],
  katowice: [50.2649, 19.0238]
};

// Generate route path coordinates (interpolation) between points
function generateRoutePoints(start, end, steps = 100) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start[0] + (end[0] - start[0]) * t;
    const lng = start[1] + (end[1] - start[1]) * t;
    points.push([lat, lng]);
  }
  return points;
}

const initialTrips = [
  {
    id: 'TR-101',
    from: 'Київ, Україна',
    to: 'Варшава, Польща',
    cargo: 'Медикаменти (Температурний режим)',
    type: 'Рефрижератор (Термо)',
    priceClient: 2450,
    priceCarrier: 2050,
    carrier: 'EuroTrans UA',
    status: 'active',
    routePoints: generateRoutePoints(cities.kyiv, cities.warsaw, 150),
    currentPointIndex: 45,
    marker: null,
    polyline: null,
    temp: 3.8
  },
  {
    id: 'TR-102',
    from: 'Львів, Україна',
    to: 'Берлін, Німеччина',
    cargo: 'Електроніка, 12т',
    type: 'Зіп-Тент',
    priceClient: 3200,
    priceCarrier: 2700,
    carrier: 'West-East Logistics',
    status: 'active',
    routePoints: generateRoutePoints(cities.lviv, cities.berlin, 200),
    currentPointIndex: 110,
    marker: null,
    polyline: null,
    temp: null
  },
  {
    id: 'TR-103',
    from: 'Дніпро, Україна',
    to: 'Катовіце, Польща',
    cargo: 'Металеві конструкції, 22т',
    type: 'Тент',
    priceClient: 2100,
    priceCarrier: 1800,
    carrier: 'Швидка Доставка',
    status: 'active',
    routePoints: generateRoutePoints(cities.dnipro, cities.katowice, 180),
    currentPointIndex: 20,
    marker: null,
    polyline: null,
    temp: null
  },
  {
    id: 'TR-104',
    from: 'Одеса, Україна',
    to: 'Констанца, Румунія',
    cargo: 'Зерно контейнерне, 20т',
    type: 'Тент',
    priceClient: 1650,
    priceCarrier: 1350,
    carrier: 'ОдесаТранс-Груп',
    status: 'delivered',
    routePoints: generateRoutePoints(cities.odessa, cities.constanta, 80),
    currentPointIndex: 80,
    marker: null,
    polyline: null,
    temp: null
  }
];

const initialCarriers = [
  { name: 'EuroTrans UA', rating: 4.9, status: 'busy', reliability: '99.1%', phone: '+380971203490' },
  { name: 'West-East Logistics', rating: 4.8, status: 'busy', reliability: '98.5%', phone: '+380509938822' },
  { name: 'Швидка Доставка', rating: 4.7, status: 'busy', reliability: '97.8%', phone: '+380637728101' },
  { name: 'ОдесаТранс-Груп', rating: 4.6, status: 'free', reliability: '95.4%', phone: '+380678833949' },
  { name: 'InterCargo Poland', rating: 4.9, status: 'free', reliability: '99.5%', phone: '+48229830200' },
  { name: 'Львів Експрес', rating: 4.7, status: 'free', reliability: '97.2%', phone: '+380931122334' },
  { name: 'Dnipro Trucking', rating: 4.5, status: 'free', reliability: '94.8%', phone: '+380665544332' }
];

const pendingCargoes = [];

let trips = [
  ...initialTrips,
  {
    id: 'CRG-201',
    from: 'Львів, Україна',
    to: 'Варшава, Польща',
    cargo: 'Харчові продукти (Заморозка)',
    type: 'Рефрижератор (Термо)',
    priceClient: 1800,
    priceCarrier: null,
    carrier: 'Очікує призначення',
    status: 'pending',
    routePoints: generateRoutePoints(cities.lviv, cities.warsaw, 120),
    currentPointIndex: 0,
    marker: null,
    polyline: null,
    temp: 4.0
  },
  {
    id: 'CRG-202',
    from: 'Київ, Україна',
    to: 'Прага, Чехія',
    cargo: 'Косметика, 8т',
    type: 'Тент',
    priceClient: 2900,
    priceCarrier: null,
    carrier: 'Очікує призначення',
    status: 'pending',
    routePoints: generateRoutePoints(cities.kyiv, cities.berlin, 120),
    currentPointIndex: 0,
    marker: null,
    polyline: null,
    temp: null
  },
  {
    id: 'CRG-203',
    from: 'Харків, Україна',
    to: 'Ряшів, Польща',
    cargo: 'Гуманітарна допомога, 15т',
    type: 'Зіп-Тент',
    priceClient: 1950,
    priceCarrier: null,
    carrier: 'Очікує призначення',
    status: 'pending',
    routePoints: generateRoutePoints(cities.lviv, cities.warsaw, 120),
    currentPointIndex: 0,
    marker: null,
    polyline: null,
    temp: null
  }
];
let carriers = [...initialCarriers];
let broadcastActiveTrip = null;

// ==========================================================================
// SYSTEM INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTabs();
  initMap();
  renderTripsTable();
  renderCarriersGrid();
  initFormCalculators();
  initBroadcastDropdown();
  initChat();
  startLiveFeed();
  startTruckMovements();
  drawTelemetryChart();
  
  // Create Trip Modal Controls
  const btnCreateTrip = document.getElementById('btn-create-trip');
  const modalCreateTrip = document.getElementById('create-trip-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const formCreateTrip = document.getElementById('create-trip-form');

  btnCreateTrip.addEventListener('click', () => {
    modalCreateTrip.classList.remove('hidden');
  });

  const closeModal = () => {
    modalCreateTrip.classList.add('hidden');
    formCreateTrip.reset();
    updateFormCalculations();
  };

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  
  formCreateTrip.addEventListener('submit', (e) => {
    e.preventDefault();
    const fromVal = document.getElementById('route-from').value;
    const toVal = document.getElementById('route-to').value;
    const cargoVal = document.getElementById('cargo-name').value;
    const typeVal = document.getElementById('cargo-type').value;
    const clientPrice = parseFloat(document.getElementById('price-client').value);
    const carrierPrice = parseFloat(document.getElementById('price-carrier').value);

    const newId = `TR-${Math.floor(100 + Math.random() * 900)}`;
    
    // Pick dynamic coordinates based on input or fallback to route points
    const startCoord = cities.kyiv; 
    const endCoord = cities.warsaw; 

    const newTrip = {
      id: newId,
      from: fromVal,
      to: toVal,
      cargo: cargoVal,
      type: typeVal,
      priceClient: clientPrice,
      priceCarrier: carrierPrice,
      carrier: 'Очікує призначення',
      status: 'pending',
      routePoints: generateRoutePoints(startCoord, endCoord, 120),
      currentPointIndex: 0,
      marker: null,
      polyline: null,
      temp: typeVal.includes('Рефрижератор') ? 4.0 : null
    };

    trips.push(newTrip);
    addTerminalLog('SYSTEM', `Створено нове замовлення ${newId}: ${fromVal} → ${toVal}. Очікує призначення перевізника.`);
    showToast('Нове замовлення', `Створено замовлення ${newId} (${fromVal.split(',')[0]} → ${toVal.split(',')[0]}). Очікує тендеру.`, 'success');
    
    // Add to broadcast selector
    pendingCargoes.push({
      id: newId,
      from: fromVal,
      to: toVal,
      cargo: cargoVal,
      type: typeVal,
      priceClient: clientPrice,
      priceCarrier: null
    });
    
    initBroadcastDropdown();
    renderTripsTable();
    closeModal();
    updateKPIs();
  });
});

// Clock widget
function initClock() {
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('current-date');
  
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uk-UA');
    const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if(timeEl) timeEl.textContent = timeStr;
    if(dateEl) dateEl.textContent = dateStr;
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// Tab navigation
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetId = tab.getAttribute('data-target');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(targetId).classList.add('active');
      
      // Leaflet needs map invalidation if it was hidden when rendered
      if (targetId === 'map-view-container' && map) {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    });
  });
}

// ==========================================================================
// MAP & TELEMETRY MODULE
// ==========================================================================

function initMap() {
  // Initialize leaflet map centered around Lviv (Western Ukraine/Poland border area)
  map = L.map('leaflet-map', {
    zoomControl: true,
    minZoom: 4
  }).setView([50.1, 23.5], 6);

  // Dark cartodb tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Plot initial active routes on the map
  trips.forEach(trip => {
    if (trip.status === 'active') {
      plotTripOnMap(trip);
    }
  });
}

function plotTripOnMap(trip, fitBounds = false) {
  // Polyline style
  const isReefer = trip.type.includes('Рефрижератор');
  const pathColor = isReefer ? '#06b6d4' : '#6366f1';
  
  const polyline = L.polyline(trip.routePoints, {
    color: pathColor,
    weight: 3,
    opacity: 0.6,
    dashArray: '5, 10'
  }).addTo(map);

  // Custom pulsing truck marker
  const glowClass = isReefer ? 'cyan-glow-icon' : 'indigo-glow-icon';
  const truckIcon = L.divIcon({
    className: 'custom-truck-icon',
    html: `<div class="truck-marker-dot ${glowClass}">🚚</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const currentCoord = trip.routePoints[trip.currentPointIndex];
  const marker = L.marker(currentCoord, { icon: truckIcon }).addTo(map);
  
  // Custom Popup content
  const popupHtml = `
    <div style="font-family: 'Inter', sans-serif; padding: 4px;">
      <h4 style="margin:0 0 4px; color: ${pathColor}">${trip.id} | ${trip.carrier}</h4>
      <strong>Маршрут:</strong> ${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}<br/>
      <strong>Вантаж:</strong> ${trip.cargo}<br/>
      <strong>Тип:</strong> ${trip.type}
    </div>
  `;
  marker.bindPopup(popupHtml);

  // Focus telemetry on reefer trip clicks
  marker.on('click', () => {
    activeTelemetryTripId = trip.id;
    updateTelemetryWidget(trip);
  });

  trip.polyline = polyline;
  trip.marker = marker;

  if (fitBounds && map) {
    const bounds = polyline.getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });
    setTimeout(() => {
      marker.openPopup();
    }, 500);
  }
}

// Telemetry widget updater
function updateTelemetryWidget(trip) {
  const telRoute = document.getElementById('tel-route');
  const telCarrier = document.getElementById('tel-carrier');
  const telCargo = document.getElementById('tel-cargo');
  const telTemp = document.getElementById('tel-temp');
  const telSpeed = document.getElementById('tel-speed');
  
  if (telRoute) telRoute.textContent = `${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}`;
  if (telCarrier) telCarrier.textContent = trip.carrier;
  if (telCargo) telCargo.textContent = trip.cargo;
  
  if (trip.temp !== null) {
    if (telTemp) {
      telTemp.textContent = `+${trip.temp.toFixed(1)}°C`;
      telTemp.className = 'gauge-val alert-success';
      // Danger alert simulation
      if (trip.temp > 5.0) {
        telTemp.className = 'gauge-val alert-danger';
      }
    }
    const tempBar = document.getElementById('tel-temp-bar');
    if (tempBar) tempBar.style.width = `${Math.min(100, (trip.temp / 10) * 100)}%`;
  } else {
    if (telTemp) telTemp.textContent = 'Н/Д';
    const tempBar = document.getElementById('tel-temp-bar');
    if (tempBar) tempBar.style.width = '0%';
  }
  
  // Simulating speed telemetry
  const randomSpeed = Math.floor(70 + Math.random() * 15);
  if (telSpeed) telSpeed.textContent = `${randomSpeed} км/год`;
  const speedBar = document.getElementById('tel-speed-bar');
  if (speedBar) speedBar.style.width = `${randomSpeed}%`;
}

// Real-time animation: advance trucks along route points
function startTruckMovements() {
  truckMovementInterval = setInterval(() => {
    trips.forEach(trip => {
      if (trip.status === 'active' && trip.routePoints && trip.routePoints.length > 0) {
        // Increment coordinate
        trip.currentPointIndex += 1;
        
        // If completed route
        if (trip.currentPointIndex >= trip.routePoints.length) {
          trip.status = 'delivered';
          trip.currentPointIndex = trip.routePoints.length - 1;
          if (trip.marker) {
            map.removeLayer(trip.marker);
          }
          if (trip.polyline) {
            map.removeLayer(trip.polyline);
          }
          addTerminalLog('SYSTEM', `Вантаж ${trip.id} (${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}) успішно доставлено отримувачу!`);
          renderTripsTable();
          updateKPIs();
          return;
        }

        // Update GPS marker coordinate
        const nextCoord = trip.routePoints[trip.currentPointIndex];
        if (trip.marker) {
          trip.marker.setLatLng(nextCoord);
        }

        // Simulating cargo refrigeration fluctuation
        if (trip.temp !== null) {
          // Normal fluctuation
          trip.temp += (Math.random() - 0.5) * 0.2;
          // Clamp range
          trip.temp = Math.max(2.0, Math.min(6.5, trip.temp));
          
          if (trip.id === activeTelemetryTripId) {
            sensorDataPoints.push(trip.temp);
            sensorDataPoints.shift();
            drawTelemetryChart();
            updateTelemetryWidget(trip);
          }
        }
      }
    });
  }, 3000);
}

// Simple Sparkline Drawer inside map telemetry card
function drawTelemetryChart() {
  const canvas = document.getElementById('sensor-mini-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  // Drawing chart line
  ctx.beginPath();
  const step = width / (sensorDataPoints.length - 1);
  
  sensorDataPoints.forEach((val, index) => {
    // Map val [2.0 to 7.0] to canvas height
    const normalizedY = height - ((val - 2) / (7 - 2)) * height;
    const x = index * step;
    if (index === 0) {
      ctx.moveTo(x, normalizedY);
    } else {
      ctx.lineTo(x, normalizedY);
    }
  });
  
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Fill gradient area under the line
  ctx.lineTo((sensorDataPoints.length - 1) * step, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

// ==========================================================================
// RENDERERS & DATA MANIPULATION
// ==========================================================================

function renderTripsTable() {
  const tbody = document.getElementById('trips-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  trips.forEach(trip => {
    const isPending = trip.status === 'pending';
    const isDelivered = trip.status === 'delivered';
    const profit = trip.priceClient - trip.priceCarrier;
    const marginPct = ((profit / trip.priceClient) * 100).toFixed(1);
    
    let statusBadge = `<span class="badge badge-active">В дорозі</span>`;
    if (isPending) statusBadge = `<span class="badge badge-pending">Очікує</span>`;
    if (isDelivered) statusBadge = `<span class="badge badge-delivered">Виконано</span>`;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="trip-route-display">
          <span class="route-desc">${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}</span>
          <span class="trip-id">${trip.id}</span>
        </div>
      </td>
      <td>${trip.cargo} <span class="badge" style="font-size:0.6rem; padding: 2px 4px; background: rgba(255,255,255,0.05); color: var(--text-muted);">${trip.type}</span></td>
      <td>€${trip.priceClient.toLocaleString()}</td>
      <td>${trip.priceCarrier ? `€${trip.priceCarrier.toLocaleString()}` : '<span style="color:var(--text-dark)">Тендер...</span>'}</td>
      <td>${trip.priceCarrier ? `${marginPct}%` : '<span style="color:var(--text-dark)">-</span>'}</td>
      <td>${trip.carrier}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn-small btn-locate" data-id="${trip.id}" ${isPending || isDelivered ? 'disabled' : ''}>
          📍 Трекінг
        </button>
      </td>
    `;
    
    // Add click event for the tracking button
    const btnLocate = row.querySelector('.btn-locate');
    btnLocate.addEventListener('click', () => {
      const activeTrip = trips.find(t => t.id === trip.id);
      if (activeTrip && activeTrip.routePoints && activeTrip.currentPointIndex < activeTrip.routePoints.length) {
        const coord = activeTrip.routePoints[activeTrip.currentPointIndex];
        map.setView(coord, 7);
        activeTelemetryTripId = activeTrip.id;
        updateTelemetryWidget(activeTrip);
        // Switch tab to map automatically
        document.querySelector('.tab-btn[data-target="map-view-container"]').click();
      }
    });

    tbody.appendChild(row);
  });
}

function renderCarriersGrid() {
  const container = document.getElementById('carriers-grid-container');
  if(!container) return;
  
  container.innerHTML = '';
  
  carriers.forEach(carrier => {
    const card = document.createElement('div');
    card.className = 'carrier-card';
    
    const stars = '★'.repeat(Math.floor(carrier.rating)) + (carrier.rating % 1 !== 0 ? '½' : '');
    const isFree = carrier.status === 'free';
    const statusText = isFree ? 'Вільний' : 'В рейсі';
    const statusClass = isFree ? 'free' : 'busy';

    card.innerHTML = `
      <div class="carrier-card-header">
        <h4>${carrier.name}</h4>
        <div style="display:flex; align-items:center; gap: 6px;">
          <span class="carrier-status ${statusClass}"></span>
          <span style="font-size:0.75rem; font-weight:600;">${statusText}</span>
        </div>
      </div>
      <div class="carrier-contacts">
        📞 ${carrier.phone}
      </div>
      <div class="carrier-kpi">
        <div class="carrier-kpi-block">
          <span class="carrier-kpi-label">KPI надійності</span>
          <span class="carrier-kpi-val">${carrier.reliability}</span>
        </div>
        <div class="carrier-kpi-block" style="text-align:right;">
          <span class="carrier-kpi-label">Рейтинг</span>
          <span class="rating-stars">${stars} (${carrier.rating})</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Initialize Quick actions inside Broadcast selectors
function initBroadcastDropdown() {
  const select = document.getElementById('broadcast-cargo-select');
  if (!select) return;
  
  select.innerHTML = '';
  
  // Find pending trips (assigned to "Очікує призначення")
  const pendings = trips.filter(t => t.status === 'pending');
  
  if (pendings.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'Немає замовлень для тендеру';
    opt.disabled = true;
    select.appendChild(opt);
    document.getElementById('btn-start-broadcast').disabled = true;
    return;
  }
  
  document.getElementById('btn-start-broadcast').disabled = false;
  
  pendings.forEach(trip => {
    const opt = document.createElement('option');
    opt.value = trip.id;
    opt.textContent = `${trip.id} | ${trip.from.split(',')[0]} → ${trip.to.split(',')[0]} (${trip.cargo})`;
    select.appendChild(opt);
  });
}

function updateKPIs() {
  const kpiRevenue = document.getElementById('kpi-revenue');
  const kpiActiveTrips = document.getElementById('kpi-active-trips');
  const kpiAvgMargin = document.getElementById('kpi-avg-margin');
  
  // Calculate stats from trips
  const activeCount = trips.filter(t => t.status === 'active').length;
  const totalCount = trips.length;
  if(kpiActiveTrips) kpiActiveTrips.textContent = `${activeCount} / ${totalCount}`;
  
  const completedAndActive = trips.filter(t => t.priceCarrier !== null);
  if(completedAndActive.length > 0) {
    const totalRevenue = completedAndActive.reduce((sum, t) => sum + t.priceClient, 0);
    if(kpiRevenue) kpiRevenue.textContent = `€${totalRevenue.toLocaleString()}`;
    
    const totalProfit = completedAndActive.reduce((sum, t) => sum + (t.priceClient - t.priceCarrier), 0);
    const avgPct = ((totalProfit / totalRevenue) * 100).toFixed(1);
    if(kpiAvgMargin) kpiAvgMargin.textContent = `${avgPct}%`;
  }
}

// Live modal calculations
function initFormCalculators() {
  const clientPriceInput = document.getElementById('price-client');
  const carrierPriceInput = document.getElementById('price-carrier');
  
  if(clientPriceInput && carrierPriceInput) {
    clientPriceInput.addEventListener('input', updateFormCalculations);
    carrierPriceInput.addEventListener('input', updateFormCalculations);
  }
}

function updateFormCalculations() {
  const clientPrice = parseFloat(document.getElementById('price-client').value) || 0;
  const carrierPrice = parseFloat(document.getElementById('price-carrier').value) || 0;
  
  const profitEl = document.getElementById('calc-margin-eur');
  const marginPctEl = document.getElementById('calc-margin-pct');
  const warningEl = document.getElementById('calc-status-warning');
  
  if (clientPrice === 0 || carrierPrice === 0) {
    profitEl.textContent = '€0';
    marginPctEl.textContent = '0%';
    warningEl.textContent = 'Введіть ціни для розрахунку';
    warningEl.className = 'calc-status';
    return;
  }
  
  const profit = clientPrice - carrierPrice;
  const pct = ((profit / clientPrice) * 100).toFixed(1);
  
  profitEl.textContent = `€${profit.toLocaleString()}`;
  marginPctEl.textContent = `${pct}%`;
  
  if (profit < 0) {
    warningEl.textContent = '🔴 Збитковий рейс! Збільшіть ціну або знайдіть дешевшого перевізника.';
    warningEl.className = 'calc-status negative';
  } else if (pct < 10.0) {
    warningEl.textContent = '🟡 Низька рентабельність! Рекомендовано маржу вище 10%.';
    warningEl.className = 'calc-status low';
  } else {
    warningEl.textContent = '🟢 Чудові фінансові показники рейсу!';
    warningEl.className = 'calc-status good';
  }
}

// ==========================================================================
// MASS BROADCAST & RADAR RADIAL TENDER MODULE
// ==========================================================================

document.getElementById('btn-start-broadcast').addEventListener('click', () => {
  const select = document.getElementById('broadcast-cargo-select');
  const selectedTripId = select.value;
  
  const trip = trips.find(t => t.id === selectedTripId);
  if (!trip) return;
  
  broadcastActiveTrip = trip;
  
  // Show Radar Screen
  const selectGroup = document.querySelector('.broadcast-selector-group');
  const descText = document.querySelector('.broadcast-body .section-desc');
  const radarScreen = document.getElementById('radar-screen');
  const bidsList = document.getElementById('bids-list');
  
  selectGroup.classList.add('hidden');
  if(descText) descText.classList.add('hidden');
  radarScreen.classList.remove('hidden');
  bidsList.innerHTML = '';
  
  addTerminalLog('ALERT', `Запущено масовий тендер на рейс ${trip.id} (${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}).`);
  showToast('Тендер запущено', `Скануємо ринок перевізників для ${trip.id}...`, 'info');
  
  // Simulated bids stream
  const potentialBids = [
    { carrier: 'Lviv Express', bid: Math.round(trip.priceClient * 0.88), delay: 1500 },
    { carrier: 'Dnipro Trucking', bid: Math.round(trip.priceClient * 0.92), delay: 2800 },
    { carrier: 'InterCargo Poland', bid: Math.round(trip.priceClient * 0.85), delay: 4000 },
    { carrier: 'EuroTrans UA', bid: Math.round(trip.priceClient * 0.83), delay: 5200 }
  ];
  
  potentialBids.forEach(item => {
    setTimeout(() => {
      if (!broadcastActiveTrip) return; // In case cancelled
      
      const bidDiv = document.createElement('div');
      bidDiv.className = 'bid-item';
      bidDiv.innerHTML = `
        <span class="bid-carrier">🚚 ${item.carrier}</span>
        <span class="bid-price">€${item.bid.toLocaleString()}</span>
      `;
      bidsList.appendChild(bidDiv);
      bidsList.scrollTop = bidsList.scrollHeight;
      
      // Ping sound / visual effect
      addTerminalLog('TELEMETRY', `Отримано ставку від ${item.carrier}: €${item.bid}`);
    }, item.delay);
  });
  
  // Complete Tender after 6.5s
  setTimeout(() => {
    if (!broadcastActiveTrip) return;
    
    // Sort bids to find lowest (best for customer margin)
    const bestBid = potentialBids.reduce((prev, current) => (prev.bid < current.bid) ? prev : current);
    
    // Display Winner screen
    radarScreen.classList.add('hidden');
    const winnerScreen = document.getElementById('tender-result-screen');
    winnerScreen.classList.remove('hidden');
    
    const profit = trip.priceClient - bestBid.bid;
    const marginPct = ((profit / trip.priceClient) * 100).toFixed(1);
    
    document.getElementById('winner-carrier-name').textContent = bestBid.carrier;
    document.getElementById('winner-bid-value').textContent = `€${bestBid.bid.toLocaleString()}`;
    document.getElementById('winner-margin-val').textContent = `${marginPct}%`;
    
    // Save winner details temporary
    broadcastActiveTrip.tempWinner = bestBid;
    showToast('Тендер завершено', `Краща ставка: €${bestBid.bid.toLocaleString()} від ${bestBid.carrier}`, 'success');
  }, 6500);
});

// Cancel / Reset Tender
document.getElementById('btn-reset-tender').addEventListener('click', resetTenderState);

function resetTenderState() {
  broadcastActiveTrip = null;
  document.getElementById('tender-result-screen').classList.add('hidden');
  document.getElementById('radar-screen').classList.add('hidden');
  document.querySelector('.broadcast-selector-group').classList.remove('hidden');
  const descText = document.querySelector('.broadcast-body .section-desc');
  if(descText) descText.classList.remove('hidden');
}

// Accept Winner and launch Trip
document.getElementById('btn-accept-winner').addEventListener('click', () => {
  if (!broadcastActiveTrip || !broadcastActiveTrip.tempWinner) return;
  
  const winner = broadcastActiveTrip.tempWinner;
  
  // Update Trip Data
  broadcastActiveTrip.carrier = winner.carrier;
  broadcastActiveTrip.priceCarrier = winner.bid;
  broadcastActiveTrip.status = 'active';
  
  // Render route on map and focus bounds
  plotTripOnMap(broadcastActiveTrip, true);
  
  // Switch to Map View to show active GPS
  document.querySelector('.tab-btn[data-target="map-view-container"]').click();
  
  addTerminalLog('SYSTEM', `Рейс ${broadcastActiveTrip.id} затверджено. Перевізник ${winner.carrier} вирушив завантажуватись.`);
  showToast('Рейс активовано', `Рейс ${broadcastActiveTrip.id} затверджено. Перевізник ${winner.carrier} вирушив у дорогу!`, 'success');
  
  // Reset UI panel
  resetTenderState();
  initBroadcastDropdown();
  renderTripsTable();
  updateKPIs();
});

// ==========================================================================
// R.A.U.M. COPILOT AI CHAT & OPTIMIZERS
// ==========================================================================

function initChat() {
  const btnSend = document.getElementById('btn-chat-send');
  const userInput = document.getElementById('chat-user-input');
  
  btnSend.addEventListener('click', handleChatSubmit);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
  });
  
  // Quick action triggers
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      handleQuickAction(action);
    });
  });
}

function handleChatSubmit() {
  const input = document.getElementById('chat-user-input');
  const query = input.value.trim();
  if (!query) return;
  
  addUserMessage(query);
  input.value = '';
  
  // Process with smart local simulator
  simulateCopilotResponse(query);
}

function handleQuickAction(action) {
  if (action === 'optimize') {
    addUserMessage('⚡ Оптимізуй ставки поточних активних замовлень');
    simulateCopilotResponse('optimize');
  } else if (action === 'instructions') {
    addUserMessage('📋 Сформуй інструкцію водію для рейсу Kyiv → Warsaw');
    simulateCopilotResponse('instructions');
  } else if (action === 'borders') {
    addUserMessage('🇪🇺 Перевір черги на польському кордоні');
    simulateCopilotResponse('borders');
  }
}

function addUserMessage(text) {
  const chatMessagesBox = document.getElementById('chat-messages-box');
  const msg = document.createElement('div');
  msg.className = 'msg user';
  msg.textContent = text;
  chatMessagesBox.appendChild(msg);
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
}

function addBotMessage(text) {
  const chatMessagesBox = document.getElementById('chat-messages-box');
  const msg = document.createElement('div');
  msg.className = 'msg bot';
  chatMessagesBox.appendChild(msg);
  
  // Stream print effect
  let i = 0;
  function typeWriter() {
    if (i < text.length) {
      // Check for markdown list items or formatting
      const char = text.charAt(i);
      msg.innerHTML += char === '\n' ? '<br/>' : char;
      i++;
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
      setTimeout(typeWriter, 12);
    }
  }
  typeWriter();
}

function showChatLoader() {
  const chatMessagesBox = document.getElementById('chat-messages-box');
  const loader = document.createElement('div');
  loader.className = 'msg bot chat-loader-msg';
  loader.innerHTML = `
    <div class="chat-loader">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatMessagesBox.appendChild(loader);
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  return loader;
}

function removeChatLoader() {
  const loader = document.querySelector('.chat-loader-msg');
  if (loader) loader.remove();
}

function simulateCopilotResponse(query) {
  const loader = showChatLoader();
  
  setTimeout(() => {
    removeChatLoader();
    let responseText = '';
    
    // Normal query check
    if (query === 'optimize' || query.toLowerCase().includes('оптиміз')) {
      const activeCount = trips.filter(t => t.status === 'active').length;
      responseText = `Аналіз рентабельності проведено успішно.\n\n📊 Результати оптимізації:\n- Загальна маржа системи: 16.4% (в межах норми).\n- Знайдено потенційне покращення для TR-102 (Львів → Берлін): заміна на перевізника InterCargo Poland дозволить знизити ставку на €150, піднявши маржинальність рейсу з 15.6% до 20.3%.\n\nБажаєте надіслати запит перевізнику?`;
    } 
    else if (query === 'instructions' || query.toLowerCase().includes('інструкц')) {
      responseText = `Сформовано автоматичну інструкцію для водія EuroTrans UA по рейсу TR-101 (Київ → Варшава):\n\n💬 ТЕКСТ ДЛЯ ВІДПРАВКИ ВОДІЮ:\n"Шановний водію! Підтверджено рейс TR-101. Маршрут: завантаження Київ (вул. Промислова 4), розвантаження Варшава. Температурний режим рефрижератора: стабільно від +2°C до +5°C. Обов'язково тримати GPS трекер увімкненим. Митний перехід: Ягодин. Номер CMR: 20491. Телефонувати при виникненні будь-яких затримок."`;
    } 
    else if (query === 'borders' || query.toLowerCase().includes('кордон')) {
      responseText = `Моніторинг черг на КПП (UA-PL border):\n\n🇵🇱 Ягодин - Дорогуськ: Очікування вантажних автомобілів ~ 8 годин (Черга помірна).\n🇵🇱 Краківець - Корчова: Затримка ~ 14 годин (Ускладнений рух).\n🇵🇱 Рава-Руська - Хребенне: Час очікування ~ 5 годин (Найбільш оптимальний перехід на цей час).\n\nРекомендую скоригувати маршрут для рейсів у напрямку Любліна через Рава-Руську.`;
    } 
    else {
      // General fallbacks
      responseText = `Прийняв ваш запит: "${query}". Оскільки я Robust Autonomous Utility Matrix, я проаналізував дані рейсів.\n\nНаразі всі 8 активних GPS-трекерів працюють у нормі, критичних затримок по маршрутах немає. Найближча важлива подія: прибуття рефрижератора TR-101 на польський кордон (Ягодин) очікується через 2 години. Чи можу я допомогти чимось іншим?`;
    }
    
    addBotMessage(responseText);
  }, 1200);
}

// ==========================================================================
// LIVE TERMINAL FEED GENERATOR
// ==========================================================================

function startLiveFeed() {
  const terminal = document.getElementById('terminal-logs');
  
  // Seed initial logs
  addTerminalLog('SYSTEM', 'Ініціалізація RAUM Logix TMS v2.4.9...');
  addTerminalLog('SYSTEM', 'Підключення до активних GPS трекерів вантажівок... Успішно.');
  addTerminalLog('TELEMETRY', 'TR-101: GPS ping - 50.4501, 30.5234 (Київ, Депо).');
  addTerminalLog('TELEMETRY', 'TR-102: GPS ping - 49.8397, 24.0297 (Львів, Термінал).');

  const randomLogs = [
    { tag: 'TELEMETRY', message: 'TR-101 (EuroTrans UA): Швидкість 78 км/год, темп. вантажу +3.9°C.' },
    { tag: 'TELEMETRY', message: 'TR-102 (West-East): GPS оновлено. Пройдено Люблін.' },
    { tag: 'TELEMETRY', message: 'TR-103 (Швидка Доставка): Водій Ivan: відпочинок на АЗС Orlen.' },
    { tag: 'ALERT', message: 'Датчик температури TR-101 (Медикаменти): незначне відхилення (+4.8°C).' },
    { tag: 'SYSTEM', message: 'Автоматичне завантаження оновлень черг на кордонах від Державної Митної Служби.' },
    { tag: 'TELEMETRY', message: 'TR-101: Митний перехід Ягодин. Заявка на чергу зареєстрована.' },
    { tag: 'TELEMETRY', message: 'TR-103: Швидкість 82 км/год. Шлях триває без затримок.' }
  ];

  logInterval = setInterval(() => {
    const selected = randomLogs[Math.floor(Math.random() * randomLogs.length)];
    addTerminalLog(selected.tag, selected.message);
  }, 5000);
}

function addTerminalLog(tag, message) {
  const terminal = document.getElementById('terminal-logs');
  if(!terminal) return;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('uk-UA');
  
  const log = document.createElement('div');
  log.className = 'log-entry';
  
  let tagClass = 'system';
  if (tag === 'ALERT') tagClass = 'alert';
  if (tag === 'TELEMETRY') tagClass = 'telemetry';
  
  log.innerHTML = `
    <span class="log-time">[${timeStr}]</span>
    <span class="log-tag ${tagClass}">${tag}</span>
    <span class="log-message">${message}</span>
  `;
  
  terminal.appendChild(log);
  terminal.scrollTop = terminal.scrollHeight;
}

// Custom Toast Notifications
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove
  const removeTimeout = setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4500);
  
  // Manual remove
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(removeTimeout);
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  });
}
