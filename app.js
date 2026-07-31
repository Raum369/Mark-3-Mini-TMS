// ==========================================================================
// RAUM LOGIX TMS - CORE INTERACTIVE ENGINE
// ==========================================================================

// Global State
let map;
let activeTelemetryTripId = null;
let currentLang = localStorage.getItem('raumLang') || 'uk';
window.appSettings = JSON.parse(localStorage.getItem('raumSettings')) || {
  theme: 'light',
  currency: 'EUR',
  units: 'km'
};

window.formatCurrency = (amount) => {
  if (window.appSettings.currency === 'USD') return `$${Math.round(amount * 1.1).toLocaleString()}`;
  if (window.appSettings.currency === 'UAH') return `₴${Math.round(amount * 42).toLocaleString()}`;
  return `€${amount.toLocaleString()}`;
};

window.formatSpeed = (speedKm) => {
  if (window.appSettings.units === 'mi') return `${Math.round(speedKm * 0.621371)} mph`;
  return `${speedKm} ${currentLang === 'uk' ? 'км/год' : 'km/h'}`;
};

let currentTileLayer = null;

window.applyTheme = () => {
  if (window.appSettings.theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    if (map) {
        if (currentTileLayer) map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
    }
  } else {
    document.documentElement.classList.remove('dark-mode');
    if (map) {
        if (currentTileLayer) map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map);
    }
  }
};
let logInterval;
let truckMovementInterval;

// Translations
const i18n = {
  uk: {
    nav_subtitle: "TMS Нового Покоління", nav_dashboard: "Дашборд", nav_trips: "Рейси та Замовлення", nav_carriers: "База Перевізників",
    nav_radar: "Тендерний Радар", nav_copilot: "AI Асистент", nav_system_active: "Система Активна", view_title_dashboard: "Дашборд",
    btn_new_order: "Нове Замовлення",
    kpi_revenue: "Загальний дохід (Місяць)", kpi_active_trips: "Активні Рейси", kpi_avg_margin: "Середня Маржа (%)", kpi_reliability: "КРІ Надійності",
    kpi_optimal: "Оптимально", kpi_no_delays: "Без запізнень", kpi_trips_pending: "очікують",
    tooltip_revenue: "Сума доходів від усіх доставлених та активних рейсів.",
    tooltip_trips: "Статус усіх замовлень.",
    tooltip_margin: "Аналітика прибутку.",
    tooltip_reliability: "Статистика надійності.",
    kpi_tt_client_rates: "Клієнтські ставки", kpi_tt_carrier_costs: "Витрати (Перевізники)",
    kpi_tt_in_transit: "В дорозі", kpi_tt_pending: "Очікують", kpi_tt_delivered: "Завершені",
    kpi_tt_avg_profit: "Сер. прибуток/рейс", kpi_tt_target: "Цільова маржа",
    kpi_tt_on_time: "Вчасна доставка", kpi_tt_temp_violations: "Порушення t°",
    map_title: "Live GPS Відстеження", map_active: "Активно",
    tel_title: "Активна Телеметрія", tel_route: "Маршрут", tel_carrier: "Перевізник", tel_cargo: "Вантаж", tel_temp: "Температура", tel_speed: "Швидкість",
    sys_feed_title: "Системний Журнал", search_placeholder: "Шукати рейси, водіїв чи маршрути...",
    table_trips_title: "Реєстр Замовлень", table_trips_subtitle: "Відстеження рейсів та показників ефективності в реальному часі", table_col_id: "ID / Маршрут", table_col_cargo: "Вантаж", table_col_price: "Ціна (Клієнт)", table_col_bid: "Ставка (Перевізник)", table_col_margin: "Маржа", table_col_carrier: "Перевізник", table_col_status: "Статус", table_col_actions: "Дії",
    radar_title: "Тендерний Радар", radar_subtitle: "Система Масового Сповіщення", radar_select_label: "Оберіть Очікуюче Замовлення", radar_btn_start: "Розпочати Трансляцію Тендеру", radar_scanning: "Сканування перевізників...", radar_tender_complete: "Тендер Завершено", radar_tender_desc: "Знайдено найкращу ставку для замовлення.", radar_bid_amount: "Сума ставки:", radar_est_margin: "Очікувана маржа:", btn_reject: "Відхилити", btn_accept: "Прийняти та Призначити",
    ai_subtitle: "Логістичний AI Асистент", ai_name: "Системний AI", ai_welcome: "Я ваша логістична інтелектуальна матриця R.A.U.M.<br>Я можу оптимізувати маршрути, прогнозувати затримки на кордонах та формувати інструкції водіям.<br>Чим можу допомогти сьогодні?", ai_quick_1: "Оптимізувати Маршрути", ai_quick_2: "Черги на Кордонах", ai_input_placeholder: "Повідомлення для Copilot...",
    modal_new_order_title: "Нове Замовлення", modal_from: "Звідки", modal_to: "Куди", modal_cargo_details: "Деталі Вантажу", modal_transport_type: "Тип Транспорту", modal_client_budget: "Бюджет Клієнта (€)", modal_carrier_rate: "Очікувана Ставка (€)", modal_est_margin: "Очікувана Маржа", modal_profitability: "Рентабельність", btn_cancel: "Скасувати", btn_create_order: "Створити Замовлення",
    // Dynamic text
    status_intransit: "В дорозі", status_pending: "Очікує", status_delivered: "Доставлено",
    btn_track: "Відстежити",
    carrier_free: "Вільний", carrier_busy: "Зайнятий",
    reliability: "Надійність", rating: "Рейтинг",
    msg_gps: "Синхронізація GPS успішна.", msg_border: "Перевірка черг на кордоні (Краківець).", msg_rates: "Ставки перевізників оновлено.", msg_tel: "Телеметрія: В нормі.",
    nav_heatmap: "Аналіз Попиту",
    tooltip_nav_radar: "Автоматично знаходить перевізників та обирає ставку з максимальною маржею.",
    tooltip_nav_heatmap: "Аналізує ринок на дефіцит або надлишок транспорту в різних регіонах.",
    tooltip_nav_copilot: "Розумний агент. Оптимізує маршрути та автономно вирішує логістичні кризи."
  },
  en: {
    nav_subtitle: "Next-Gen TMS", nav_dashboard: "Dashboard", nav_trips: "Trips & Orders", nav_carriers: "Carriers Base",
    nav_radar: "Tender Radar", nav_copilot: "AI Copilot", nav_system_active: "System Active", view_title_dashboard: "Dashboard",
    btn_new_order: "New Order",
    kpi_revenue: "Total Revenue (Month)", kpi_active_trips: "Active Trips", kpi_avg_margin: "Avg Margin (%)", kpi_reliability: "Reliability KPI",
    kpi_optimal: "Optimal", kpi_no_delays: "No critical delays", kpi_trips_pending: "pending",
    tooltip_revenue: "Sum of revenue from all delivered and active trips.",
    tooltip_trips: "Status of all orders.",
    tooltip_margin: "Profit analytics.",
    tooltip_reliability: "Reliability statistics.",
    kpi_tt_client_rates: "Client Rates", kpi_tt_carrier_costs: "Carrier Costs",
    kpi_tt_in_transit: "In Transit", kpi_tt_pending: "Pending", kpi_tt_delivered: "Delivered",
    kpi_tt_avg_profit: "Avg Profit / Trip", kpi_tt_target: "Target Margin",
    kpi_tt_on_time: "On-time Delivery", kpi_tt_temp_violations: "Temp Violations",
    map_title: "Live GPS Tracking", map_active: "Active",
    tel_title: "Active Telemetry", tel_route: "Route", tel_carrier: "Carrier", tel_cargo: "Cargo", tel_temp: "Temperature", tel_speed: "Speed",
    sys_feed_title: "System Feed", search_placeholder: "Search shipments, drivers or routes...",
    table_trips_title: "Order Registry", table_trips_subtitle: "Real-time shift tracking and performance metrics", table_col_id: "ID / Route", table_col_cargo: "Cargo", table_col_price: "Price (Client)", table_col_bid: "Bid (Carrier)", table_col_margin: "Margin", table_col_carrier: "Carrier", table_col_status: "Status", table_col_actions: "Actions",
    radar_title: "Tender Radar", radar_subtitle: "Mass Broadcast System", radar_select_label: "Select Pending Order", radar_btn_start: "Initiate Tender Broadcast", radar_scanning: "Scanning for carriers...", radar_tender_complete: "Tender Complete", radar_tender_desc: "Best bid secured for order.", radar_bid_amount: "Bid Amount:", radar_est_margin: "Est. Margin:", btn_reject: "Reject", btn_accept: "Accept & Assign",
    ai_subtitle: "AI Logistics Assistant", ai_name: "System AI", ai_welcome: "Greetings, Vlad. I am your logistics intelligence matrix. I can optimize routes, predict border delays, and draft driver instructions. How can I assist you today?", ai_quick_1: "Optimize Routes", ai_quick_2: "Border Queues", ai_input_placeholder: "Message Copilot...",
    modal_new_order_title: "New Order", modal_from: "From", modal_to: "To", modal_cargo_details: "Cargo Details", modal_transport_type: "Transport Type", modal_client_budget: "Client Budget (€)", modal_carrier_rate: "Est. Carrier Rate (€)", modal_est_margin: "Est. Margin", modal_profitability: "Profitability", btn_cancel: "Cancel", btn_create_order: "Create Order",
    // Dynamic text
    status_intransit: "In Transit", status_pending: "Pending", status_delivered: "Delivered",
    btn_track: "Track",
    carrier_free: "Available", carrier_busy: "Busy",
    reliability: "Reliability", rating: "Rating",
    msg_gps: "GPS Sync OK.", msg_border: "Checking border queues (Krakovets).", msg_rates: "Carrier rates updated.", msg_tel: "Telemetry: Nominal.",
    nav_heatmap: "Local-for-Local",
    tooltip_nav_radar: "Automatically finds carriers and selects the bid with max margin.",
    tooltip_nav_heatmap: "Analyzes the market for transport shortages or oversupply in different regions.",
    tooltip_nav_copilot: "Smart agent. Optimizes routes and autonomously resolves logistics crises."
  }
};

const cities = {
  kyiv: [50.4501, 30.5234], lviv: [49.8397, 24.0297], warsaw: [52.2297, 21.0122],
  berlin: [52.5200, 13.4050], odessa: [46.4825, 30.7233], constanta: [44.1792, 28.6498],
  dnipro: [48.4647, 35.0462], katowice: [50.2649, 19.0238], prague: [50.0755, 14.4378],
  'київ': [50.4501, 30.5234], 'львів': [49.8397, 24.0297], 'варшава': [52.2297, 21.0122],
  'берлін': [52.5200, 13.4050], 'одеса': [46.4825, 30.7233], 'констанца': [44.1792, 28.6498],
  'дніпро': [48.4647, 35.0462], 'катовіце': [50.2649, 19.0238], 'прага': [50.0755, 14.4378]
};

async function fetchRealRoute(start, end) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
            return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
    } catch (e) {
        console.error('Routing error:', e);
    }
    return null;
}

async function loadRealRoutes() {
    for (let trip of trips) {
        let startCity = trip.from.split(',')[0].toLowerCase().trim();
        let endCity = trip.to.split(',')[0].toLowerCase().trim();
        
        let start = cities[startCity] || cities.kyiv;
        let end = cities[endCity] || cities.warsaw;
        
        let realPoints = await fetchRealRoute(start, end);
        if (realPoints && realPoints.length > 0) {
            const progress = trip.currentPointIndex / trip.routePoints.length;
            trip.routePoints = realPoints;
            trip.currentPointIndex = Math.floor(progress * realPoints.length);
            
            if (trip.polyline) trip.polyline.setLatLngs(realPoints);
            if (trip.marker) trip.marker.setLatLng(realPoints[trip.currentPointIndex]);
            if (trip.startMarker) trip.startMarker.setLatLng(realPoints[0]);
            if (trip.endMarker) trip.endMarker.setLatLng(realPoints[realPoints.length - 1]);
        }
    }
}

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

let trips = [
  { id: 'TR-101', from: 'Київ, UA', to: 'Варшава, PL', cargo: 'Meds (Thermo)', type: 'Рефрижератор (Термо)', priceClient: 2450, priceCarrier: 2050, carrier: 'EuroTrans UA', status: 'active', routePoints: generateRoutePoints(cities.kyiv, cities.warsaw, 150), currentPointIndex: 45, temp: 3.8 },
  { id: 'TR-102', from: 'Львів, UA', to: 'Берлін, DE', cargo: 'Electronics, 12t', type: 'Зіп-Тент', priceClient: 3200, priceCarrier: 2700, carrier: 'West-East Logistics', status: 'active', routePoints: generateRoutePoints(cities.lviv, cities.berlin, 200), currentPointIndex: 110, temp: null },
  { id: 'TR-103', from: 'Дніпро, UA', to: 'Катовіце, PL', cargo: 'Steel Pipes, 22t', type: 'Тент', priceClient: 2100, priceCarrier: 1800, carrier: 'Shvydka Dostavka', status: 'active', routePoints: generateRoutePoints(cities.dnipro, cities.katowice, 180), currentPointIndex: 20, temp: null },
  { id: 'TR-104', from: 'Одеса, UA', to: 'Констанца, RO', cargo: 'Grain, 20t', type: 'Тент', priceClient: 1650, priceCarrier: 1350, carrier: 'OdessaTrans Group', status: 'delivered', routePoints: generateRoutePoints(cities.odessa, cities.constanta, 80), currentPointIndex: 80, temp: null },
  { id: 'CRG-201', from: 'Львів, UA', to: 'Варшава, PL', cargo: 'Frozen Food', type: 'Рефрижератор (Термо)', priceClient: 1800, priceCarrier: null, carrier: '---', status: 'pending', routePoints: generateRoutePoints(cities.lviv, cities.warsaw, 120), currentPointIndex: 0, temp: 4.0 },
  { id: 'CRG-202', from: 'Київ, UA', to: 'Прага, CZ', cargo: 'Cosmetics, 8t', type: 'Тент', priceClient: 2900, priceCarrier: null, carrier: '---', status: 'pending', routePoints: generateRoutePoints(cities.kyiv, cities.berlin, 120), currentPointIndex: 0, temp: null }
];

let carriers = [
  { name: 'EuroTrans UA', rating: 4.9, status: 'busy', reliability: '99.1%', phone: '+380971203490' },
  { name: 'West-East Logistics', rating: 4.8, status: 'busy', reliability: '98.5%', phone: '+380509938822' },
  { name: 'Shvydka Dostavka', rating: 4.7, status: 'busy', reliability: '97.8%', phone: '+380637728101' },
  { name: 'OdessaTrans Group', rating: 4.6, status: 'free', reliability: '95.4%', phone: '+380678833949' },
  { name: 'InterCargo Poland', rating: 4.9, status: 'free', reliability: '99.5%', phone: '+48229830200' },
  { name: 'Lviv Express', rating: 4.7, status: 'free', reliability: '97.2%', phone: '+380931122334' },
  { name: 'Dnipro Trucking', rating: 4.5, status: 'free', reliability: '94.8%', phone: '+380665544332' }
];

let broadcastActiveTrip = null;

// ==========================================================================
// SYSTEM INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initLangToggle();
  applyLang();
  initClock();
  initNavigation();
  initMap();
  loadRealRoutes();
  renderTripsTable();
  renderCarriersGrid();
  initFormCalculators();
  initBroadcastDropdown();
  initChat();
  startLiveFeed();
  startTruckMovements();
  updateKPIs();
  
  // Trip Modal
  document.getElementById('btn-create-trip').addEventListener('click', () => document.getElementById('create-trip-modal').classList.remove('hidden'));
  document.getElementById('btn-close-modal').addEventListener('click', closeTripModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeTripModal);
  document.getElementById('create-trip-form').addEventListener('submit', handleCreateTrip);
  
  // Radar Panel
  document.getElementById('btn-toggle-radar').addEventListener('click', () => togglePanel('panel-radar'));
  const btnHeatmap = document.getElementById('btn-toggle-heatmap');
  if(btnHeatmap) btnHeatmap.addEventListener('click', toggleHeatmap);

  // Copilot Panel
  const btnCopilot = document.getElementById('btn-toggle-copilot');
  if(btnCopilot) btnCopilot.addEventListener('click', () => togglePanel('panel-copilot'));
  
  // Notifications Dropdown Toggle
  const btnNotif = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notifications-dropdown');
  if(btnNotif && notifDropdown) {
      btnNotif.addEventListener('click', (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
          if (!notifDropdown.contains(e.target) && !btnNotif.contains(e.target)) {
              notifDropdown.classList.add('hidden');
          }
      });
  }

  // Settings Modal Toggle
  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  if(btnSettings && settingsModal) {
      btnSettings.addEventListener('click', () => {
          settingsModal.classList.remove('hidden');
      });
      document.querySelectorAll('.close-settings').forEach(btn => {
          btn.addEventListener('click', () => {
              settingsModal.classList.add('hidden');
          });
      });
  }

  // Settings Options Toggle (Visual)
  document.querySelectorAll('.settings-group').forEach(group => {
      const options = group.querySelectorAll('.settings-option');
      options.forEach(opt => {
          opt.addEventListener('click', () => {
              options.forEach(o => {
                  o.classList.remove('active', 'bg-white', 'shadow-sm', 'font-bold', 'text-primary');
                  o.classList.add('font-medium', 'text-gray-500', 'hover:text-gray-800');
              });
              opt.classList.remove('font-medium', 'text-gray-500', 'hover:text-gray-800');
              opt.classList.add('active', 'bg-white', 'shadow-sm', 'font-bold', 'text-primary');
          });
      });
  });

  // Load initial active states for Settings
  document.querySelectorAll('.settings-option').forEach(opt => {
      const type = opt.getAttribute('data-type');
      const val = opt.getAttribute('data-value');
      if (window.appSettings[type] === val) {
          opt.parentElement.querySelectorAll('.settings-option').forEach(o => {
              o.classList.remove('active', 'bg-white', 'shadow-sm', 'font-bold', 'text-primary');
              o.classList.add('font-medium', 'text-gray-500', 'hover:text-gray-800');
          });
          opt.classList.remove('font-medium', 'text-gray-500', 'hover:text-gray-800');
          opt.classList.add('active', 'bg-white', 'shadow-sm', 'font-bold', 'text-primary');
      }
  });

  const btnSaveSettings = document.getElementById('btn-save-settings');
  if(btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
          document.querySelectorAll('.settings-option.active').forEach(opt => {
              const type = opt.getAttribute('data-type');
              const val = opt.getAttribute('data-value');
              if (type && val) {
                  window.appSettings[type] = val;
              }
          });
          localStorage.setItem('raumSettings', JSON.stringify(window.appSettings));
          
          window.applyTheme();
          renderTripsTable();
          updateKPIs();
          
          if(settingsModal) settingsModal.classList.add('hidden');
          showToast(currentLang === 'uk' ? 'Налаштування' : 'Settings', currentLang === 'uk' ? 'Зміни успішно збережено.' : 'Changes saved successfully.', 'success');
      });
  }

  window.applyTheme();
  
  // Close Panels
  document.querySelectorAll('.btn-close-panel').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.currentTarget.closest('.slide-panel').classList.remove('open');
          e.currentTarget.closest('.slide-panel').classList.add('closed');
      });
  });
});

// ==========================================================================
// LANGUAGE TOGGLE
// ==========================================================================

function initLangToggle() {
    const btnUk = document.getElementById('lang-uk');
    const btnEn = document.getElementById('lang-en');
    
    const activeClass = "px-3 py-1.5 text-[10px] font-bold bg-sidebar text-white rounded-full transition-colors";
    const inactiveClass = "px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-sidebar transition-colors rounded-full";

    btnUk.addEventListener('click', () => {
        currentLang = 'uk';
        btnUk.className = activeClass;
        btnEn.className = inactiveClass;
        applyLang();
    });
    
    btnEn.addEventListener('click', () => {
        currentLang = 'en';
        btnEn.className = activeClass;
        btnUk.className = inactiveClass;
        applyLang();
    });
}

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(i18n[currentLang][key]) {
            el.innerHTML = i18n[currentLang][key];
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if(i18n[currentLang][key]) {
            el.setAttribute('placeholder', i18n[currentLang][key]);
        }
    });
    
    // update dynamic content
    renderTripsTable();
    renderCarriersGrid();
    initBroadcastDropdown();
}

function t(key) {
    return i18n[currentLang][key] || key;
}

// ==========================================================================
// MODAL & NAVIGATION
// ==========================================================================

function closeTripModal() {
  document.getElementById('create-trip-modal').classList.add('hidden');
  document.getElementById('create-trip-form').reset();
  updateFormCalculations();
}

function handleCreateTrip(e) {
  e.preventDefault();
  const fromVal = document.getElementById('route-from').value;
  const toVal = document.getElementById('route-to').value;
  const cargoVal = document.getElementById('cargo-name').value;
  const typeVal = document.getElementById('cargo-type').value;
  const clientPrice = parseFloat(document.getElementById('price-client').value);
  const carrierPrice = parseFloat(document.getElementById('price-carrier').value);

  const newId = `TR-${Math.floor(100 + Math.random() * 900)}`;
  
  const newTrip = {
    id: newId, from: fromVal, to: toVal, cargo: cargoVal, type: typeVal,
    priceClient: clientPrice, priceCarrier: carrierPrice, carrier: '---',
    status: 'pending', routePoints: generateRoutePoints(cities.kyiv, cities.warsaw, 120),
    currentPointIndex: 0, marker: null, polyline: null, temp: typeVal.includes('Рефрижератор') ? 4.0 : null,
    isNew: true
  };

  fetchRealRoute(cities.kyiv, cities.warsaw).then(points => {
      if (points) {
          newTrip.routePoints = points;
          if (newTrip.polyline) newTrip.polyline.setLatLngs(points);
      }
  });

  trips.unshift(newTrip);
  addTerminalLog(`New Order ${newId} created: ${fromVal} → ${toVal}`);
  showToast(t('modal_new_order_title'), `${newId} ready for tender.`, 'success');
  
  initBroadcastDropdown();
  renderTripsTable();
  closeTripModal();
  updateKPIs();
}

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.spa-view');
    const title = document.getElementById('current-view-title');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.getAttribute('data-target');
            
            if (target === 'view-trips') {
                const dashBtn = document.querySelector('.nav-btn[data-target="view-dashboard"]');
                if (dashBtn) dashBtn.click();
                const tableEl = document.querySelector('.overflow-x-auto table');
                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            navBtns.forEach(b => {
                b.classList.remove('bg-sidebarActive', 'text-white', 'shadow-md');
                b.classList.add('text-gray-400');
            });
            btn.classList.add('bg-sidebarActive', 'text-white', 'shadow-md');
            btn.classList.remove('text-gray-400');
            
            views.forEach(v => v.classList.add('hidden'));
            if(document.getElementById(target)) {
                document.getElementById(target).classList.remove('hidden');
            }
            
            if (title && btn.querySelector('.font-body')) {
                title.innerHTML = btn.querySelector('.font-body').innerHTML;
            }
            
            if(target === 'view-dashboard' && map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
}

let copilotGreeted = false;
let isCopilotTyping = false;

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if(panel.classList.contains('closed')) {
        document.querySelectorAll('.slide-panel').forEach(p => {
            p.classList.remove('open');
            p.classList.add('closed');
        });
        panel.classList.remove('closed');
        panel.classList.add('open');
        
        if (panelId === 'panel-copilot' && !copilotGreeted) {
            copilotGreeted = true;
            if (typeof generateContextAwareGreeting === 'function') {
                generateContextAwareGreeting();
            }
        }
    } else {
        panel.classList.remove('open');
        panel.classList.add('closed');
    }
}

// ==========================================================================
// UTILS & MAP
// ==========================================================================

function initClock() {
  const updateTime = () => {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('uk-UA');
    document.getElementById('current-date').textContent = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  updateTime();
  setInterval(updateTime, 1000);
}

function showToast(title, msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-secondary' : 'bg-primary';
    toast.className = `${bg} text-white p-4 rounded-sm shadow-xl flex flex-col gap-1 transition-opacity opacity-0 transform translate-y-4 duration-300 min-w-[250px]`;
    toast.innerHTML = `<span class="font-bold text-xs uppercase tracking-widest">${title}</span><span class="text-xs">${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('opacity-0', 'translate-y-4'); }, 50);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function addTerminalLog(msg) {
    const term = document.getElementById('terminal-logs');
    if (!term) return;
    const time = new Date().toLocaleTimeString('uk-UA');
    const el = document.createElement('div');
    el.innerHTML = `<span class="text-gray-400">[${time}]</span> <span class="text-secondary">${msg}</span>`;
    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
}

function startLiveFeed() {
    setInterval(() => {
        const msgs = [t('msg_gps'), t('msg_border'), t('msg_rates'), t('msg_tel')];
        addTerminalLog(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 12000);
}

function initMap() {
  map = L.map('leaflet-map', { zoomControl: false, minZoom: 4 }).setView([50.1, 23.5], 6);
  window.applyTheme();
  trips.forEach(trip => { if (trip.status === 'active') plotTripOnMap(trip); });
}

// =====================================
// HEATMAP: Local-for-Local Supply Chain
// =====================================
let isHeatmapActive = false;
let heatmapLayerGroup = null;

function createHeatmapNode(lat, lng, radius, color, intensity) {
    return L.circle([lat, lng], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: intensity,
        stroke: false,
        className: 'heatmap-blur'
    });
}

function initHeatmap() {
    heatmapLayerGroup = L.layerGroup([
        // Germany (High Demand / Red)
        createHeatmapNode(51.16, 10.45, 120000, '#ef4444', 0.8), 
        createHeatmapNode(50.11, 8.68, 80000, '#ef4444', 0.9),
        createHeatmapNode(52.52, 13.40, 100000, '#ef4444', 0.7),
        // Poland (Medium Demand / Yellow)
        createHeatmapNode(52.22, 21.01, 150000, '#eab308', 0.6),
        // Ukraine (Oversupply / Blue)
        createHeatmapNode(49.83, 24.02, 90000, '#3b82f6', 0.8),
        createHeatmapNode(50.45, 30.52, 130000, '#3b82f6', 0.7),
    ]);
}

window.toggleHeatmap = function() {
    isHeatmapActive = !isHeatmapActive;
    const btn = document.getElementById('btn-toggle-heatmap');
    const mapEl = document.getElementById('leaflet-map');
    
    if (isHeatmapActive) {
        if (!heatmapLayerGroup) initHeatmap();
        map.addLayer(heatmapLayerGroup);
        btn.classList.add('bg-white/10', 'text-white');
        btn.classList.remove('text-gray-400');
        
        // Add dark contrast to make colors pop
        mapEl.style.transition = "filter 0.5s ease";
        mapEl.style.filter = "contrast(1.1) saturate(1.5) brightness(0.9)";
        
        addTerminalLog("Local-for-Local Heatmap activated: Scanning regional capacity.");
        
        // 2026 Trend: Agentic AI proactively reaches out
        setTimeout(() => {
            const msg = currentLang === 'uk' 
                ? `Аналіз Попиту завершено ✅<br><br>Я виявив дефіцит провізних ємностей в Німеччині "🟥 зона"<br><br>У нас є 2 Вільні траки в сусідньому регіоні.<br>Можу перемістити їх туди для максимізації прибутку<br>( Очікуваний профіт +€450 )` 
                : "Local-for-Local scan complete. I detected a capacity shortage in Germany (Red zone). We have 2 empty trucks nearby. Reposition them to maximize profit (Est. +€450)?";
            
            const actionHtml = `<button onclick="this.innerHTML='<span class=\\'material-symbols-outlined text-[14px]\\'>check</span> Виконано'; this.classList.remove('bg-pink-500', 'hover:bg-pink-600'); this.classList.add('bg-emerald-500'); executeRepositioning(); setTimeout(()=>togglePanel('panel-copilot'), 1500);" class="mt-3 bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors w-full flex justify-center items-center gap-2"><span class="material-symbols-outlined text-[14px]">my_location</span> ${currentLang === 'uk' ? 'Підтвердити переміщення' : 'Confirm Repositioning'}</button>`;
            
            // Open copilot panel if closed to show proactivity
            const copilotPanel = document.getElementById('panel-copilot');
            if(copilotPanel && copilotPanel.classList.contains('closed')) {
                togglePanel('panel-copilot');
            }
            
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                addChatMessage(msg, false, actionHtml);
            }, 800);
            
        }, 1200);

    } else {
        if (heatmapLayerGroup) map.removeLayer(heatmapLayerGroup);
        btn.classList.remove('bg-white/10', 'text-white');
        btn.classList.add('text-gray-400');
        mapEl.style.filter = "none";
        addTerminalLog("Heatmap deactivated.");
    }
}

window.executeRepositioning = async function() {
    // Prevent double execution
    if (trips.some(t => t.id === 'REP-777')) return;

    let finalRoutePoints = [];
    try {
        const res = await fetch('https://router.project-osrm.org/route/v1/driving/21.0122,52.2297;8.6821,50.1109?overview=full&geometries=geojson');
        const data = await res.json();
        const coords = data.routes[0].geometry.coordinates; // [lng, lat]
        const step = Math.max(1, Math.floor(coords.length / 150)); // Target ~150 points for realistic speed
        for (let i = 0; i < coords.length; i += step) {
            finalRoutePoints.push([coords[i][1], coords[i][0]]);
        }
        finalRoutePoints.push([50.1109, 8.6821]);
    } catch(e) {
        if (typeof generateRoutePoints === 'function') {
            finalRoutePoints = generateRoutePoints([52.2297, 21.0122], [50.1109, 8.6821], 150);
        } else {
            finalRoutePoints = [[52.2297, 21.0122], [50.1109, 8.6821]];
        }
    }

    const repoTrip = {
        id: 'REP-777',
        routePoints: finalRoutePoints,
        from: currentLang === 'uk' ? "Варшава, Польща" : "Warsaw, Poland",
        to: currentLang === 'uk' ? "Франкфурт, Німеччина" : "Frankfurt, Germany",
        cargo: currentLang === 'uk' ? "Репозиціонування (Пустий)" : "Repositioning (Empty)",
        type: "Тент 20т",
        priceClient: 450, // Expected profit added
        priceCarrier: 0,
        status: 'active',
        currentPointIndex: 0,
        carrier: "Власний Автопарк",
        isNew: true
    };
    
    trips.unshift(repoTrip);
    plotTripOnMap(repoTrip);
    renderTripsTable();
    updateKPIs();
    addTerminalLog(`AI Agent initiated repositioning: ${repoTrip.id} (Warsaw -> Frankfurt). Expected profit: +€450.`);
}

function plotTripOnMap(trip) {
  const isReefer = trip.type.includes('Рефрижератор');
  const pathColor = isReefer ? '#006d35' : '#000000';
  
  const polyline = L.polyline(trip.routePoints, { color: pathColor, weight: 3, opacity: 0.6, dashArray: '5, 10' }).addTo(map);
  const truckIcon = L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="background:${pathColor}; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px ${pathColor}80;"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8]
  });

  const startIcon = L.divIcon({
    className: 'custom-start-icon',
    html: `<div style="background:#fff; color:${pathColor}; width:20px; height:20px; border-radius:50%; border:2px solid ${pathColor}; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; font-family:sans-serif; box-shadow:0 2px 4px rgba(0,0,0,0.3);">A</div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
  });

  const endIcon = L.divIcon({
    className: 'custom-end-icon',
    html: `<div style="background:${pathColor}; color:#fff; width:20px; height:20px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; font-family:sans-serif; box-shadow:0 2px 4px rgba(0,0,0,0.3);">B</div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
  });

  const startMarker = L.marker(trip.routePoints[0], { icon: startIcon }).addTo(map);
  const endMarker = L.marker(trip.routePoints[trip.routePoints.length - 1], { icon: endIcon }).addTo(map);
  const marker = L.marker(trip.routePoints[trip.currentPointIndex], { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);

  marker.on('click', () => {
    activeTelemetryTripId = trip.id;
    updateTelemetryWidget(trip);
  });

  trip.polyline = polyline;
  trip.marker = marker;
  trip.startMarker = startMarker;
  trip.endMarker = endMarker;
}

function updateTelemetryWidget(trip) {
  if (document.getElementById('tel-route')) document.getElementById('tel-route').textContent = `${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}`;
  if (document.getElementById('tel-carrier')) document.getElementById('tel-carrier').textContent = trip.carrier;
  if (document.getElementById('tel-cargo')) document.getElementById('tel-cargo').textContent = trip.cargo;
  
  if (trip.temp !== null) {
    if (document.getElementById('tel-temp')) document.getElementById('tel-temp').textContent = `+${trip.temp.toFixed(1)}°C`;
    if (document.getElementById('tel-temp-bar')) document.getElementById('tel-temp-bar').style.width = `${Math.min(100, (trip.temp / 10) * 100)}%`;
  } else {
    if (document.getElementById('tel-temp')) document.getElementById('tel-temp').textContent = 'N/A';
    if (document.getElementById('tel-temp-bar')) document.getElementById('tel-temp-bar').style.width = '0%';
  }
  const randomSpeed = Math.floor(70 + Math.random() * 15);
  if (document.getElementById('tel-speed')) document.getElementById('tel-speed').textContent = window.formatSpeed(randomSpeed);
  if (document.getElementById('tel-speed-bar')) document.getElementById('tel-speed-bar').style.width = `${randomSpeed}%`;
}

function startTruckMovements() {
  truckMovementInterval = setInterval(() => {
    trips.forEach(trip => {
      if (trip.status === 'active' && trip.routePoints && trip.routePoints.length > 0) {
        trip.currentPointIndex += (trip.id === 'REP-777' ? 12 : 1);
        if (trip.currentPointIndex >= trip.routePoints.length) {
          trip.status = 'delivered';
          trip.currentPointIndex = trip.routePoints.length - 1;
          if (trip.marker) map.removeLayer(trip.marker);
          if (trip.polyline) map.removeLayer(trip.polyline);
          if (trip.startMarker) map.removeLayer(trip.startMarker);
          if (trip.endMarker) map.removeLayer(trip.endMarker);
          addTerminalLog(`Delivery Complete: ${trip.id}`);
          renderTripsTable();
          updateKPIs();
          
          setTimeout(() => {
            const panel = document.getElementById('panel-copilot');
            if (panel && panel.classList.contains('closed')) {
                togglePanel('panel-copilot');
            }
            if (typeof showTypingIndicator === 'function') {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    const alertMsg = currentLang === 'uk'
                        ? `✅ Готово Сер.<br>Вантажівка по рейсу ( ${trip.id} ) дісталася місця призначення. Загальний дохід оновлено.`
                        : `✅ **Success!** Truck for trip **${trip.id}** has safely reached its destination. Total revenue updated, client is satisfied.`;
                    addChatMessage(alertMsg, false);
                }, 1500);
            }
          }, 1000);
          
          return;
        }
        if (trip.marker) trip.marker.setLatLng(trip.routePoints[trip.currentPointIndex]);
        if (trip.temp !== null) {
          trip.temp += (Math.random() - 0.5) * 0.2;
          trip.temp = Math.max(2.0, Math.min(6.5, trip.temp));
          if (trip.id === activeTelemetryTripId) updateTelemetryWidget(trip);
        }
      }
    });
  }, 3000);
}

// ==========================================================================
// RENDERING
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
    
    let statusText = t('status_intransit');
    let statusBadge = `<span class="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 w-max"><div class="w-2 h-2 rounded-full bg-blue-500"></div> ${statusText}</span>`;
    
    if (isPending) {
        statusText = t('status_pending');
        statusBadge = `<span class="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 w-max"><div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> ${statusText}</span>`;
    }
    if (isDelivered) {
        statusText = t('status_delivered');
        statusBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 w-max"><div class="w-2 h-2 rounded-full bg-emerald-500"></div> ${statusText}</span>`;
    }
    
    const row = document.createElement('tr');
    row.className = `hover:bg-gray-50 transition-colors group ${trip.isNew ? 'row-highlight' : ''}`;
    
    if (trip.isNew) {
      setTimeout(() => { trip.isNew = false; }, 3000);
    }

    row.innerHTML = `
      <td class="px-4 py-5">
        <div class="text-sm font-bold text-gray-900">${trip.id}</div>
        <div class="text-[10px] text-gray-500 font-medium mt-1 truncate max-w-[120px]">${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}</div>
      </td>
      <td class="px-4 py-5 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-gray-500 text-sm">person</span>
        </div>
        <div>
          <div class="text-sm font-bold text-gray-900">${trip.cargo}</div>
          <div class="text-[10px] text-gray-500 font-medium mt-0.5 truncate max-w-[100px]">${trip.carrier}</div>
        </div>
      </td>
      <td class="px-4 py-5 text-sm font-bold text-gray-900">${window.formatCurrency(trip.priceClient)}</td>
      <td class="px-4 py-5 text-xs text-gray-500 font-medium">${trip.type}</td>
      <td class="px-4 py-5">${statusBadge}</td>
      <td class="px-4 py-5">
        <div class="flex items-center gap-2">
            <div class="flex-grow bg-gray-100 rounded-full h-1.5 overflow-hidden w-24">
                <div class="bg-primary h-full rounded-full" style="width: ${(trip.currentPointIndex / trip.routePoints.length) * 100}%"></div>
            </div>
            <span class="text-xs font-bold text-gray-700">${Math.round((trip.currentPointIndex / trip.routePoints.length) * 100)}%</span>
        </div>
      </td>
      <td class="px-4 py-5 text-right">
        <button class="btn-locate text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-50" data-id="${trip.id}" ${isPending || isDelivered ? 'disabled' : ''}>
            <span class="material-symbols-outlined text-lg">location_searching</span>
        </button>
      </td>
    `;
    
    const btnLocate = row.querySelector('.btn-locate');
    btnLocate.addEventListener('click', () => {
      if(!btnLocate.disabled && map) {
        document.querySelector('.nav-btn[data-target="view-dashboard"]').click();
        const coord = trip.routePoints[trip.currentPointIndex];
        map.setView(coord, 7);
        activeTelemetryTripId = trip.id;
        updateTelemetryWidget(trip);
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
    const isFree = carrier.status === 'free';
    const statusText = isFree ? t('carrier_free') : t('carrier_busy');
    const statusClass = isFree 
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
        : 'bg-orange-50 text-orange-600 border border-orange-100';
    const dotClass = isFree ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500';
    
    const initials = carrier.name.substring(0, 2).toUpperCase();
    const gradients = [
        'from-blue-500 to-indigo-500',
        'from-emerald-400 to-cyan-500',
        'from-orange-400 to-rose-400',
        'from-purple-500 to-indigo-500'
    ];
    const gradient = gradients[carrier.name.length % gradients.length];

    container.innerHTML += `
      <div class="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group">
        <div class="flex justify-between items-start mb-5">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                    ${initials}
                </div>
                <h4 class="font-headline font-extrabold text-base text-primary">${carrier.name}</h4>
            </div>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusClass}">
                <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
                <span class="text-[9px] font-extrabold uppercase tracking-wider">${statusText}</span>
            </div>
        </div>
        <div class="text-sm text-gray-500 font-medium mb-5 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl w-max">
            <span class="material-symbols-outlined text-[16px] text-indigo-400">call</span> ${carrier.phone}
        </div>
        <div class="flex justify-between border-t border-gray-100 pt-4">
            <div>
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <span class="material-symbols-outlined text-[14px] text-emerald-400">verified_user</span> ${t('reliability')}
                </div>
                <div class="font-bold text-emerald-600 text-lg">${carrier.reliability}</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1 mb-1">
                    ${t('rating')} <span class="material-symbols-outlined text-[14px] text-amber-400">star</span>
                </div>
                <div class="font-bold text-amber-500 text-lg">${carrier.rating} <span class="text-xs text-gray-400 font-medium">/ 5.0</span></div>
            </div>
        </div>
      </div>
    `;
  });
}

function updateKPIs() {
  const pendingCount = trips.filter(t => t.status === 'pending').length;
  const activeCount = trips.filter(t => t.status === 'active').length;
  const deliveredCount = trips.filter(t => t.status === 'delivered').length;
  
  if (document.getElementById('kpi-active-trips')) document.getElementById('kpi-active-trips').textContent = `${activeCount} / ${trips.length}`;
  const pendingEl = document.querySelector('[data-i18n="kpi_trips_pending"]');
  if (pendingEl) pendingEl.textContent = `${pendingCount} ${t('kpi_trips_pending')}`;
  
  // Tooltip details for Trips
  if (document.getElementById('tt-in-transit')) document.getElementById('tt-in-transit').textContent = activeCount;
  if (document.getElementById('tt-pending')) document.getElementById('tt-pending').textContent = pendingCount;
  if (document.getElementById('tt-delivered')) document.getElementById('tt-delivered').textContent = deliveredCount;
  
  const completedAndActive = trips.filter(t => t.priceCarrier !== null);
  if (completedAndActive.length > 0) {
    const totalRevenue = completedAndActive.reduce((sum, t) => sum + t.priceClient, 0);
    const totalCarrierCosts = completedAndActive.reduce((sum, t) => sum + t.priceCarrier, 0);
    const totalProfit = totalRevenue - totalCarrierCosts;
    const avgProfit = totalProfit / completedAndActive.length;

    if (document.getElementById('kpi-revenue')) document.getElementById('kpi-revenue').textContent = window.formatCurrency(totalRevenue);
    if (document.getElementById('kpi-avg-margin')) document.getElementById('kpi-avg-margin').textContent = `${((totalProfit / totalRevenue) * 100).toFixed(1)}%`;
    
    // Tooltip details for Revenue & Margin
    if (document.getElementById('tt-client-rates')) document.getElementById('tt-client-rates').textContent = window.formatCurrency(totalRevenue);
    if (document.getElementById('tt-carrier-costs')) document.getElementById('tt-carrier-costs').textContent = window.formatCurrency(totalCarrierCosts);
    if (document.getElementById('tt-avg-profit')) document.getElementById('tt-avg-profit').textContent = window.formatCurrency(avgProfit);
  }
}

function initFormCalculators() {
  document.getElementById('price-client').addEventListener('input', updateFormCalculations);
  document.getElementById('price-carrier').addEventListener('input', updateFormCalculations);
}

function updateFormCalculations() {
  const clientPrice = parseFloat(document.getElementById('price-client').value) || 0;
  const carrierPrice = parseFloat(document.getElementById('price-carrier').value) || 0;
  const profitEl = document.getElementById('calc-margin-eur');
  const pctEl = document.getElementById('calc-margin-pct');
  
  if (clientPrice === 0 || carrierPrice === 0) {
    profitEl.textContent = '€0'; pctEl.textContent = '0%';
    return;
  }
  const profit = clientPrice - carrierPrice;
  const pct = ((profit / clientPrice) * 100).toFixed(1);
  profitEl.textContent = `€${profit.toLocaleString()}`;
  pctEl.textContent = `${pct}%`;
  
  if (profit < 0) pctEl.className = 'text-lg font-bold text-error';
  else pctEl.className = 'text-lg font-bold text-secondary';
}

// ==========================================================================
// RADAR TENDER MODULE
// ==========================================================================

function initBroadcastDropdown() {
  const select = document.getElementById('broadcast-cargo-select');
  select.innerHTML = '';
  const pendings = trips.filter(t => t.status === 'pending');
  
  if (pendings.length === 0) {
    select.innerHTML = `<option disabled selected>${currentLang === 'uk' ? 'Немає очікуючих замовлень' : 'No pending orders'}</option>`;
    document.getElementById('btn-start-broadcast').disabled = true;
    return;
  }
  document.getElementById('btn-start-broadcast').disabled = false;
  pendings.forEach(trip => {
    select.innerHTML += `<option value="${trip.id}">${trip.id} | ${trip.from.split(',')[0]} → ${trip.to.split(',')[0]}</option>`;
  });
}

document.getElementById('btn-start-broadcast').addEventListener('click', () => {
  const selectedTripId = document.getElementById('broadcast-cargo-select').value;
  broadcastActiveTrip = trips.find(t => t.id === selectedTripId);
  if (!broadcastActiveTrip) return;
  
  document.querySelector('.broadcast-selector-group').classList.add('hidden');
  document.getElementById('radar-screen').classList.remove('hidden');
  const bidsList = document.getElementById('bids-list');
  bidsList.innerHTML = '';
  
  addTerminalLog(`Tender initiated for ${broadcastActiveTrip.id}`);
  
  const potentialBids = [
    { carrier: 'Lviv Express', bid: Math.round(broadcastActiveTrip.priceClient * 0.88), delay: 1500 },
    { carrier: 'Dnipro Trucking', bid: Math.round(broadcastActiveTrip.priceClient * 0.92), delay: 2800 },
    { carrier: 'InterCargo Poland', bid: Math.round(broadcastActiveTrip.priceClient * 0.85), delay: 4000 }
  ];
  
  potentialBids.forEach(item => {
    setTimeout(() => {
      if (!broadcastActiveTrip) return;
      bidsList.innerHTML += `
        <div class="bg-gray-50 p-3 rounded-xl text-xs font-bold flex justify-between items-center shadow-sm border border-gray-100 mb-2">
            <span class="text-gray-600">${item.carrier}</span>
            <span class="text-primary text-sm">€${item.bid.toLocaleString()}</span>
        </div>`;
      addTerminalLog(`Bid received: ${item.carrier} (€${item.bid})`);
    }, item.delay);
  });
  
  setTimeout(() => {
    if (!broadcastActiveTrip) return;
    const bestBid = potentialBids.reduce((p, c) => (p.bid < c.bid) ? p : c);
    
    document.getElementById('radar-screen').classList.add('hidden');
    document.getElementById('tender-result-screen').classList.remove('hidden');
    
    const marginPct = (((broadcastActiveTrip.priceClient - bestBid.bid) / broadcastActiveTrip.priceClient) * 100).toFixed(1);
    
    document.getElementById('winner-carrier-name').textContent = bestBid.carrier;
    document.getElementById('winner-bid-value').textContent = `€${bestBid.bid.toLocaleString()}`;
    document.getElementById('winner-margin-val').textContent = `${marginPct}%`;
    broadcastActiveTrip.tempWinner = bestBid;
    showToast(t('radar_tender_complete'), `Best bid: €${bestBid.bid.toLocaleString()} from ${bestBid.carrier}`, 'success');
  }, 5000);
});

document.getElementById('btn-reset-tender').addEventListener('click', resetTenderState);

function resetTenderState() {
  broadcastActiveTrip = null;
  document.getElementById('tender-result-screen').classList.add('hidden');
  document.getElementById('radar-screen').classList.add('hidden');
  document.querySelector('.broadcast-selector-group').classList.remove('hidden');
}

document.getElementById('btn-accept-winner').addEventListener('click', () => {
  if (!broadcastActiveTrip || !broadcastActiveTrip.tempWinner) return;
  const winner = broadcastActiveTrip.tempWinner;
  
  broadcastActiveTrip.carrier = winner.carrier;
  broadcastActiveTrip.priceCarrier = winner.bid;
  broadcastActiveTrip.status = 'active';
  plotTripOnMap(broadcastActiveTrip);
  
  addTerminalLog(`Order ${broadcastActiveTrip.id} assigned to ${winner.carrier}.`);
  renderTripsTable();
  updateKPIs();
  initBroadcastDropdown();
  resetTenderState();
  togglePanel('panel-radar');
});

// ==========================================================================
// AI COPILOT CHAT
// ==========================================================================

function showTypingIndicator() {
  if (isCopilotTyping) return;
  isCopilotTyping = true;
  const box = document.getElementById('chat-messages-box');
  const msg = document.createElement('div');
  msg.id = 'copilot-typing-indicator';
  msg.className = `p-4 rounded-2xl shadow-sm max-w-[85%] self-start bg-white rounded-bl-sm border border-gray-100 flex items-center gap-1`;
  msg.innerHTML = `
    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
  `;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
  isCopilotTyping = false;
  const indicator = document.getElementById('copilot-typing-indicator');
  if (indicator) indicator.remove();
}

function generateContextAwareGreeting() {
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const pendingCount = trips.filter(t => t.status === 'pending').length;
    if (pendingCount > 0) {
      const text = currentLang === 'uk' 
        ? `Сер. <br>Помітив, що у вас ( ${pendingCount} рейси ) очікують на призначення. <br>Бажаєте, я запущу для них Тендерний Радар?`
        : `Hello! I noticed you have **${pendingCount} trips** waiting for assignment. Shall I launch the Tender Radar for them?`;
      addChatMessage(text, false, `<button onclick="togglePanel('panel-radar')" class="mt-3 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors w-full flex justify-center items-center gap-2"><span class="material-symbols-outlined text-[14px]">radar</span> ${currentLang === 'uk' ? 'Відкрити Радар' : 'Open Radar'}</button>`);
    } else {
      const text = currentLang === 'uk' ? "Вітаю! Усі рейси призначені. Чим можу допомогти сьогодні?" : "Hello! All trips are assigned. How can I help you today?";
      addChatMessage(text, false);
    }
  }, 1200);
}

function initChat() {
  const input = document.getElementById('chat-user-input');
  const btn = document.getElementById('btn-chat-send');
  
  const sendMessage = () => {
    const val = input.value.trim();
    if (!val) return;
    addChatMessage(val, true);
    input.value = '';
    
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      addChatMessage(currentLang === 'uk' ? "Обробка запиту через RAUM Logic Engine..." : "Processing request via RAUM Logic Engine...", false);
      
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        let response = currentLang === 'uk' ? "Система проаналізувала дані. Усі показники в нормі." : "System analyzed the data. All metrics are normal.";
        let actionHtml = '';
        
        if (val.includes("Оптимізувати") || val.includes("Optimize")) {
           response = currentLang === 'uk' ? "Аналіз марштруту TR-101 (Київ-Варшава)... Знайдено об'їзд через трасу М09 у зв'язку з ремонтом дороги. Це заощадить 45 хвилин та 12 літрів пального." : "Route TR-101 analysis... Found detour via M09. Saves 45 mins and 12L of fuel.";
           actionHtml = `<button onclick="alert('Route updated!')" class="mt-3 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors w-full flex justify-center items-center gap-2"><span class="material-symbols-outlined text-[14px]">alt_route</span> ${currentLang === 'uk' ? 'Змінити маршрут' : 'Update Route'}</button>`;
        } else if (val.includes("Черги") || val.includes("Border")) {
           response = currentLang === 'uk' ? "Запит до серверів митниці... На ПП 'Краківець-Корчова' черга 4.5 км (прибл. 8 годин очікування). Рекомендую перенаправити вантажівку TR-102 на ПП 'Рава-Руська'." : "Customs check... Krakovets queue is 4.5km (8 hours). Recommend rerouting TR-102 to Rava-Ruska.";
           actionHtml = `<button onclick="alert('Truck rerouted!')" class="mt-3 bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors w-full flex justify-center items-center gap-2"><span class="material-symbols-outlined text-[14px]">near_me</span> ${currentLang === 'uk' ? 'Перенаправити вантаж' : 'Reroute Cargo'}</button>`;
        } else if (val.includes("Статус") || val.includes("Driver")) {
           response = currentLang === 'uk' ? "Синхронізація з тахографами...<br>• Водій Влад (TR-101): за кермом 7 год 20 хв. За 40 хв йому потрібна обов'язкова пауза 45 хв.<br>• Водій Марко (TR-102): на відпочинку (залишилось 2 год)." : "Tachograph sync...<br>• Vlad (TR-101): Driving 7h 20m. Break needed in 40m.<br>• Marko (TR-102): Resting.";
           actionHtml = `<button onclick="alert('Reminder sent to Vlad')" class="mt-3 bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors w-full flex justify-center items-center gap-2"><span class="material-symbols-outlined text-[14px]">notifications</span> ${currentLang === 'uk' ? 'Надіслати попередження Владу' : 'Alert Vlad'}</button>`;
        }
        
        addChatMessage(response, false, actionHtml);
      }, 1500);
    }, 1000);
  };
  
  btn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
  
  document.querySelectorAll('.quick-action-btn').forEach(b => {
    b.addEventListener('click', () => {
      input.value = b.textContent;
      sendMessage();
    });
  });
}

function addChatMessage(text, isUser, actionHtml = '') {
  const box = document.getElementById('chat-messages-box');
  const msg = document.createElement('div');
  msg.className = `p-5 rounded-2xl shadow-sm max-w-[85%] border border-gray-100 ${isUser ? 'self-end bg-primary rounded-br-sm' : 'self-start bg-white rounded-bl-sm'}`;
  
  if(!isUser) {
      msg.innerHTML = `<p class="font-bold text-primary mb-2 text-[10px] uppercase tracking-widest flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">smart_toy</span> RAUM COPILOT</p><div class="text-gray-700 text-sm leading-relaxed mb-1">${text}</div>${actionHtml}`;
  } else {
      msg.innerHTML = `<p class="font-bold text-white/70 mb-2 text-[10px] uppercase tracking-widest text-right">You</p><p class="text-white text-sm leading-relaxed">${text}</p>`;
  }
  
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

// ==========================================
// Excel Export Functionality (ExcelJS)
// ==========================================
async function exportTripsToExcel() {
    if (!trips || trips.length === 0) {
        alert("Немає даних для експорту.");
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Logistics Pro TMS';
        workbook.lastModifiedBy = 'Logistics Pro TMS';
        workbook.created = new Date();
        workbook.modified = new Date();

        // ---------------------------------------------------------
        // 1. DASHBOARD SHEET (WOW Effect)
        // ---------------------------------------------------------
        const dashSheet = workbook.addWorksheet('Дашборд');

        // Calculate KPIs
        let totalRevenue = 0;
        let totalCarrierCost = 0;
        let totalMargin = 0;
        let activeTripsCount = 0;
        let deliveredTripsCount = 0;

        trips.forEach(t => {
            if (t.priceClient) totalRevenue += t.priceClient;
            if (t.priceCarrier) totalCarrierCost += t.priceCarrier;
            if (t.status === 'active') activeTripsCount++;
            if (t.status === 'delivered') deliveredTripsCount++;
        });
        totalMargin = totalRevenue - totalCarrierCost;
        let avgMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) : 0;

        // Styling for Dashboard
        dashSheet.columns = [
            { width: 5 }, { width: 35 }, { width: 20 }, { width: 5 }, { width: 35 }, { width: 20 }
        ];

        // Title
        dashSheet.mergeCells('B2:F3');
        const titleCell = dashSheet.getCell('B2');
        titleCell.value = 'ЛОГІСТИЧНИЙ ДАШБОРД';
        titleCell.font = { name: 'Arial Black', size: 24, color: { argb: 'FF0F172A' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Subtitle
        dashSheet.mergeCells('B4:F4');
        const subtitleCell = dashSheet.getCell('B4');
        subtitleCell.value = `Згенеровано: ${new Date().toLocaleString('uk-UA')}`;
        subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // KPI Box 1: Revenue & Margin
        dashSheet.getCell('B7').value = 'ФІНАНСОВІ ПОКАЗНИКИ';
        dashSheet.getCell('B7').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        dashSheet.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        dashSheet.getCell('B7').alignment = { horizontal: 'center' };
        dashSheet.mergeCells('B7:C7');

        dashSheet.getCell('B8').value = 'Загальний Дохід:';
        dashSheet.getCell('C8').value = totalRevenue;
        dashSheet.getCell('C8').numFmt = '€#,##0.00';

        dashSheet.getCell('B9').value = 'Витрати на перевізників:';
        dashSheet.getCell('C9').value = totalCarrierCost;
        dashSheet.getCell('C9').numFmt = '€#,##0.00';

        dashSheet.getCell('B10').value = 'Чистий Прибуток (Маржа):';
        dashSheet.getCell('C10').value = totalMargin;
        dashSheet.getCell('C10').numFmt = '€#,##0.00';
        dashSheet.getCell('C10').font = { bold: true, color: { argb: 'FF10B981' } };

        dashSheet.getCell('B11').value = 'Середня Маржинальність:';
        dashSheet.getCell('C11').value = avgMarginPercent;
        dashSheet.getCell('C11').numFmt = '0.00%';
        dashSheet.getCell('C11').font = { bold: true, color: { argb: 'FF10B981' } };
        
        ['B8','B9','B10','B11','C8','C9','C10','C11'].forEach(c => dashSheet.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' });

        // KPI Box 2: Operations
        dashSheet.getCell('E7').value = 'ОПЕРАЦІЙНІ ПОКАЗНИКИ';
        dashSheet.getCell('E7').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        dashSheet.getCell('E7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        dashSheet.getCell('E7').alignment = { horizontal: 'center' };
        dashSheet.mergeCells('E7:F7');

        dashSheet.getCell('E8').value = 'Всього рейсів у системі:';
        dashSheet.getCell('F8').value = trips.length;

        dashSheet.getCell('E9').value = 'Активні рейси (в дорозі):';
        dashSheet.getCell('F9').value = activeTripsCount;
        dashSheet.getCell('F9').font = { bold: true, color: { argb: 'FF3B82F6' } };

        dashSheet.getCell('E10').value = 'Доставлені рейси:';
        dashSheet.getCell('F10').value = deliveredTripsCount;
        dashSheet.getCell('F10').font = { bold: true, color: { argb: 'FF10B981' } };
        
        ['E8','E9','E10','F8','F9','F10'].forEach(c => dashSheet.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' });

        // Add some borders to KPIs
        ['B7','C7','E7','F7','B8','B9','B10','B11','C8','C9','C10','C11', 'E8','E9','E10','F8','F9','F10'].forEach(cell => {
            dashSheet.getCell(cell).border = {
                top: {style:'thin', color: {argb:'FF000000'}},
                bottom: {style:'thin', color: {argb:'FF000000'}},
                left: {style:'thin', color: {argb:'FF000000'}},
                right: {style:'thin', color: {argb:'FF000000'}}
            };
        });

        // ---------------------------------------------------------
        // 2. DATA SHEET (Manifest)
        // ---------------------------------------------------------
        const dataSheet = workbook.addWorksheet('Дані рейсів');
        
        dataSheet.columns = [
            { header: 'ID Рейсу', key: 'id', width: 15 },
            { header: 'Звідки', key: 'from', width: 20 },
            { header: 'Куди', key: 'to', width: 20 },
            { header: 'Вантаж', key: 'cargo', width: 30 },
            { header: 'Тип авто', key: 'type', width: 15 },
            { header: 'Перевізник', key: 'carrier', width: 25 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Ставка Клієнта', key: 'priceClient', width: 18, style: { numFmt: '€#,##0.00' } },
            { header: 'Ставка Перевізника', key: 'priceCarrier', width: 20, style: { numFmt: '€#,##0.00' } },
            { header: 'Маржа (€)', key: 'marginE', width: 15, style: { numFmt: '€#,##0.00' } },
            { header: 'Маржа (%)', key: 'marginP', width: 15, style: { numFmt: '0.00%' } }
        ];

        // Style the header row
        dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        dataSheet.views = [{ state: 'frozen', ySplit: 1 }]; // Freeze top row

        // Add rows
        trips.forEach(trip => {
            let marginE = 0;
            let marginP = 0;
            if (trip.priceClient && trip.priceCarrier) {
                marginE = trip.priceClient - trip.priceCarrier;
                marginP = trip.priceClient > 0 ? (marginE / trip.priceClient) : 0;
            }

            let translatedStatus = trip.status;
            if (trip.status === 'active') translatedStatus = 'В дорозі';
            if (trip.status === 'delivered') translatedStatus = 'Доставлено';
            if (trip.status === 'pending') translatedStatus = 'Очікує';

            const row = dataSheet.addRow({
                id: trip.id,
                from: trip.from,
                to: trip.to,
                cargo: trip.cargo,
                type: trip.type,
                carrier: trip.carrier,
                status: translatedStatus,
                priceClient: trip.priceClient || 0,
                priceCarrier: trip.priceCarrier || 0,
                marginE: marginE,
                marginP: marginP
            });

            // Center all cells in the row
            row.eachCell({ includeEmpty: true }, cell => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Color coding for status
            const statusCell = row.getCell('status');
            if (trip.status === 'active') {
                statusCell.font = { color: { argb: 'FF2563EB' }, bold: true };
            } else if (trip.status === 'delivered') {
                statusCell.font = { color: { argb: 'FF059669' }, bold: true };
            } else {
                statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
            }

            // Margin coloring (green if > 0)
            const marginCell = row.getCell('marginE');
            if (marginE > 0) {
                marginCell.font = { color: { argb: 'FF059669' }, bold: true };
                row.getCell('marginP').font = { color: { argb: 'FF059669' }, bold: true };
            }
        });

        // Add alternating row colors for Manifest
        dataSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                if (rowNumber % 2 === 0) {
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
                // Add borders to all cells
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: {style:'thin', color: {argb:'FFE2E8F0'}},
                        left: {style:'thin', color: {argb:'FFE2E8F0'}},
                        bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
                        right: {style:'thin', color: {argb:'FFE2E8F0'}}
                    };
                });
            }
        });

        // Generate and download Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'TMS_Dashboard_Report.xlsx'); // Using FileSaver.js

    } catch (err) {
        console.error("Помилка генерації Excel:", err);
        alert("Виникла помилка при генерації Excel.");
    }
}

// Attach event listener on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to bind the button
    const exportBtn = document.getElementById('btn-export-excel');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTripsToExcel);
    }
});

