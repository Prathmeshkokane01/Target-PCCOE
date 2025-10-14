// --- DOM ELEMENTS ---
const languageSelect = document.getElementById('language-select');
const detailsTitle = document.getElementById('details-title');
const riskAssessmentEl = document.getElementById('risk-assessment');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const rainfallEl = document.getElementById('rainfall');
const pressureEl = document.getElementById('pressure');
const windSpeedEl = document.getElementById('wind-speed');
const forecastCanvas = document.getElementById('forecast-chart');
const mapEl = document.getElementById('map');
const chartLegendEl = document.getElementById('chart-legend');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const historicalContentEl = document.getElementById('historical-content');
const impactContentEl = document.getElementById('impact-content');
const actionsContentEl = document.getElementById('actions-content');
const cropContentEl = document.getElementById('crop-content');
const soilContentEl = document.getElementById('soil-content');
const imdAlertContentEl = document.getElementById('imd-alert-content');
const disasterContentEl = document.getElementById('disaster-content');
const reportBtn = document.getElementById('report-condition-btn');
const userReportsContentEl = document.getElementById('user-reports-content');
const loadingOverlay = document.getElementById('loading-overlay');
const feelsLikeEl = document.getElementById('feels-like');
const visibilityEl = document.getElementById('visibility');
const aqiEl = document.getElementById('aqi');
const aqiStatusEl = document.getElementById('aqi-status');
const aqiCardEl = document.getElementById('aqi-card');
const helplineContentEl = document.getElementById('helpline-content');
const weatherIconEl = document.getElementById('weather-icon');
const uvIndexEl = document.getElementById('uv-index');
const uvStatusEl = document.getElementById('uv-status');
const uvCardEl = document.getElementById('uv-card');
const sunriseTimeEl = document.getElementById('sunrise-time');
const sunsetTimeEl = document.getElementById('sunset-time');
const locationMapBtn = document.getElementById('location-map-btn');
const radarMapBtn = document.getElementById('radar-map-btn');
const radarMapIframe = document.getElementById('radar-map-iframe');
const statusHeaderEl = document.getElementById('status-header');

// --- APP STATE ---
let map;
let forecastChart;
let currentDistrictData = {}; 
let districtMarker;
let chatContext = { district: null, lastResponseData: {} };

// --- TRANSLATION DATA ---
const translations = {
    en: {
        title: "IN National Monsoon Watch", subtitle: "AI-Powered Decision Support System",
        risk_level_title: "Current Risk Level",
        ai_assistant: "AI Weather Assistant", ask_placeholder: "Ask about weather or impact...",
        impact_analysis: "Impact Analysis", recommended_actions: "Recommended Actions", crop_advisory: "Crop-Specific Advisory",
        soil_advisory: "Soil & Planting Advisory", historical_incidents: "Historical Incidents",
        red_zone: "Red Zone", yellow_zone: "Yellow Zone", green_zone: "Green Zone",
        detailed_view: "Detailed View for", temperature: "Temperature", humidity: "Humidity", current_rainfall: "Current Rainfall",
        pressure: "Pressure", wind_speed: "Wind Speed", geo_location: "Geographic View", precip_forecast: "5-Day Precipitation Forecast (mm per 3h)",
        loading: "Loading...", data_unavailable: "Data Unavailable", status: "Status",
        ai_welcome: "Hello! I am an AI weather assistant. You can ask me for the current weather, forecast, AQI, UV Index, or impact advisories.",
        ai_error: "I'm sorry, I encountered an error. Please try your question again.",
        ai_fallback: "I can provide a weather forecast, impact analysis, or recommended actions for <b>{district}</b>.",
        ai_greeting: "Hello! How can I help you with the weather today?",
        status_red: "High Risk. Predicted rainfall of {value} mm is severe.",
        status_yellow: "Moderate Risk. Predicted rainfall of {value} mm is significant.",
        status_green: "Low Risk. Predicted rainfall of {value} mm is safe.",
    },
    mr: {
        title: "राष्ट्रीय मान्सून वॉच", subtitle: "AI-चालित निर्णय समर्थन प्रणाली",
        risk_level_title: "सध्याची जोखीम पातळी",
        ai_assistant: "AI हवामान सहाय्यक", ask_placeholder: "हवामान किंवा परिणामाबद्दल विचारा...",
        status_red: "उच्च धोका. अंदाजित पाऊस {value} मिमी आहे.",
        status_yellow: "मध्यम धोका. अंदाजित पाऊस {value} मिमी आहे.",
        status_green: "कमी धोका. अंदाजित पाऊस {value} मिमी सुरक्षित आहे.",
    },
    hi: {
        title: "राष्ट्रीय मानसून वॉच", subtitle: "AI-संचालित निर्णय समर्थन प्रणाली",
        risk_level_title: "वर्तमान जोखिम स्तर",
        ai_assistant: "AI मौसम सहायक", ask_placeholder: "मौसम या प्रभाव के बारे में पूछें...",
        status_red: "उच्च जोखिम। अनुमानित वर्षा {value} मिमी है।",
        status_yellow: "मध्यम जोखिम। अनुमानित वर्षा {value} मिमी है।",
        status_green: "कम जोखिम। अनुमानित वर्षा {value} मिमी सुरक्षित है।",
    }
};

// --- DATA ---
const cityHelplines = {
    "Mumbai": { "Disaster Management": "1916", "Police": "100", "Ambulance": "108" },
    "Delhi": { "Disaster Management": "1077", "Police": "112", "Ambulance": "102" },
    "Pune": { "Disaster Management": "1077", "Police": "112", "Ambulance": "108" },
    "Bengaluru": { "Disaster Management": "1070", "Police": "100", "Ambulance": "108" },
    "Chennai": { "Disaster Management": "1070", "Police": "100", "Ambulance": "108" },
    "Kolkata": { "Disaster Management": "1070", "Police": "100", "Ambulance": "102" },
    "Default": { "National Disaster Helpline": "1078", "Police": "112", "Ambulance": "108" }
};

// --- CORE APPLICATION LOGIC ---
async function initializePage() {
    loadingOverlay.style.display = 'flex';
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
        alert("Please set your OpenWeatherMap API key in the config.js file.");
        loadingOverlay.style.display = 'none';
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat'), lon = params.get('lon');
    if (!lat || !lon) {
        detailsTitle.textContent = "Error: No location selected.";
        loadingOverlay.style.display = 'none';
        return;
    }
    const [forecastData, currentData, airQualityData, uvData] = await Promise.all([
        getForecastData(lat, lon), getCurrentWeatherData(lat, lon),
        getAirQualityData(lat, lon), getUvData(lat, lon)
    ]);
    if (!forecastData || !currentData) {
        detailsTitle.textContent = "Error: Could not load weather data.";
        loadingOverlay.style.display = 'none';
        return;
    }
    currentDistrictData = {
        name: forecastData.city.name, lat, lon,
        risk: getRiskLevel(forecastData), forecastData,
        currentData, airQualityData, uvData
    };
    chatContext.district = currentDistrictData.name;
    translatePage(languageSelect.value);
    loadingOverlay.style.display = 'none';
}

async function getForecastData(lat, lon) { try { const r = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`); if (!r.ok) throw new Error(); return await r.json(); } catch (e) { console.error("Forecast fetch failed", e); return null; } }
async function getCurrentWeatherData(lat, lon) { try { const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`); if (!r.ok) throw new Error(); return await r.json(); } catch (e) { console.error("Current weather fetch failed", e); return null; } }
async function getAirQualityData(lat, lon) { try { const r = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`); if (!r.ok) throw new Error(); return await r.json(); } catch (e) { console.error("AQI fetch failed", e); return null; } }
async function getUvData(lat, lon) { try { const r = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`); if (!r.ok) throw new Error(); return await r.json(); } catch (e) { console.error("UV fetch failed", e); return null; } }

// --- UI UPDATE FUNCTIONS ---
function updateDetailedView() {
    const lang = languageSelect.value;
    const district = currentDistrictData;
    detailsTitle.textContent = `${translations[lang]?.detailed_view || 'Detailed View for'} ${district.name}`;
    updateRiskAssessment(district.risk);
    updateCurrentConditions(district.currentData);
    updateMap(district.lat, district.lon);
    updateForecastChart(district.forecastData.list);
    updateAirQuality(district.airQualityData);
    updateHelplines(district.name);
    updateUvIndex(district.uvData);
    updateRadarMap(district.lat, district.lon);
}

function getRiskLevel(data) { let maxRain = 0; data.list.slice(0, 8).forEach(item => { const r = item.rain?.['3h'] || 0; if (r > maxRain) maxRain = r; }); if (maxRain > 10) return { level: 'danger', value: maxRain }; if (maxRain > 5) return { level: 'warning', value: maxRain }; return { level: 'normal', value: maxRain }; }

function updateRiskAssessment(risk) {
    const lang = languageSelect.value;
    statusHeaderEl.className = 'status-header';
    let key = `status_${risk.level === 'danger' ? 'red' : risk.level === 'warning' ? 'yellow' : 'green'}`;
    riskAssessmentEl.textContent = (translations[lang]?.[key] || "").replace('{value}', risk.value.toFixed(2));
    statusHeaderEl.classList.add(risk.level);
}

function updateCurrentConditions(current) {
    temperatureEl.textContent = `${current.main.temp.toFixed(1)}°C`;
    feelsLikeEl.textContent = `Feels like ${current.main.feels_like.toFixed(1)}°C`;
    humidityEl.textContent = `${current.main.humidity}%`;
    rainfallEl.textContent = `${(current.rain?.['1h'] || 0).toFixed(1)} mm`;
    pressureEl.textContent = `${current.main.pressure} hPa`;
    windSpeedEl.textContent = `${(current.wind.speed * 3.6).toFixed(1)} km/h`;
    visibilityEl.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    weatherIconEl.innerHTML = `<i class="fas ${getWeatherIconClass(current.weather[0].icon)}"></i>`;
    const sunrise = new Date(current.sys.sunrise * 1000), sunset = new Date(current.sys.sunset * 1000);
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    sunriseTimeEl.textContent = sunrise.toLocaleTimeString('en-IN', timeOptions);
    sunsetTimeEl.textContent = sunset.toLocaleTimeString('en-IN', timeOptions);
}

function getWeatherIconClass(iconCode) { if (iconCode.startsWith('01')) return 'fa-sun'; if (iconCode.startsWith('02')) return 'fa-cloud-sun'; if (iconCode.startsWith('03') || iconCode.startsWith('04')) return 'fa-cloud'; if (iconCode.startsWith('09')) return 'fa-cloud-showers-heavy'; if (iconCode.startsWith('10')) return 'fa-cloud-sun-rain'; if (iconCode.startsWith('11')) return 'fa-bolt'; if (iconCode.startsWith('13')) return 'fa-snowflake'; if (iconCode.startsWith('50')) return 'fa-smog'; return 'fa-question-circle'; }

function updateAirQuality(aqiData) { if (!aqiData?.list?.[0]) { aqiEl.textContent = "N/A"; aqiStatusEl.textContent = "Unavailable"; return; } const aqiValue = aqiData.list[0].main.aqi; const statuses = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"]; aqiEl.textContent = aqiValue; aqiStatusEl.textContent = statuses[aqiValue]; aqiCardEl.className = `card aqi-card aqi-${statuses[aqiValue]?.toLowerCase()}`; }

function updateUvIndex(uvData) { if (typeof uvData?.current?.uvi === 'undefined') { uvIndexEl.textContent = "N/A"; uvStatusEl.textContent = "Unavailable"; return; } const uv = uvData.current.uvi; let status = "Low", color = "low"; if (uv > 2) { status = "Moderate"; color = "moderate"; } if (uv > 5) { status = "High"; color = "high"; } if (uv > 7) { status = "Very High"; color = "very-high"; } if (uv > 10) { status = "Extreme"; color = "extreme"; } uvIndexEl.textContent = uv.toFixed(1); uvStatusEl.textContent = status; uvCardEl.className = `card uv-card uv-${color}`; }

function updateHelplines(cityName) { const h = cityHelplines[cityName] || cityHelplines.Default; let html = '<ul>'; for (const [s, n] of Object.entries(h)) { html += `<li><strong>${s}:</strong> <a href="tel:${n}">${n}</a></li>`; } helplineContentEl.innerHTML = html + '</ul>'; }

function updateMap(lat, lon) { if (!map) { map = L.map(mapEl).setView([lat, lon], 9); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map); } else { map.setView([lat, lon], 9); } if (districtMarker) { districtMarker.setLatLng([lat, lon]); } else { districtMarker = L.marker([lat, lon]).addTo(map); } }

function updateRadarMap(lat, lon) { radarMapIframe.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&o=80&c=2&t=1`; }

function updateForecastChart(list) { const labels = list.map(i => new Date(i.dt * 1000).toLocaleTimeString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric' })); const data = list.map(i => i.rain?.['3h'] || 0); if (forecastChart) { forecastChart.data.labels = labels; forecastChart.data.datasets[0].data = data; forecastChart.update(); return; } forecastChart = new Chart(forecastCanvas, { type: 'bar', data: { labels, datasets: [{ label: 'Precipitation (mm)', data, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderColor: '#fff' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.2)' } }, x: { ticks: { color: '#fff', maxRotation: 70, minRotation: 70 }, grid: { display: false } } } } }); }

function translatePage(lang) {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        const translation = translations[lang]?.[key] || translations['en'][key];
        if (translation) {
            const icon = el.querySelector('i');
            if (icon) {
                el.innerHTML = `<i class="${icon.className}"></i> ${translation}`;
            } else {
                el.textContent = translation;
            }
        }
    });
    if (currentDistrictData.name) {
        updateDetailedView();
    }
    const welcomeKey = translations[lang]?.ai_welcome || translations['en'].ai_welcome;
    chatBox.innerHTML = '';
    addMessageToChatbox(welcomeKey, 'ai');
}

// --- EVENT LISTENERS ---
languageSelect.addEventListener('change', (e) => translatePage(e.target.value));
sendBtn.addEventListener('click', () => { /* Stub */ });
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { /* Stub */ } });
window.addEventListener('load', initializePage);
reportBtn.addEventListener('click', () => { alert("Thank you! Crowdsourced reports help improve our AI model's accuracy."); });
locationMapBtn.addEventListener('click', () => { mapEl.style.display = 'block'; radarMapIframe.style.display = 'none'; locationMapBtn.classList.add('active'); radarMapBtn.classList.remove('active'); });
radarMapBtn.addEventListener('click', () => { mapEl.style.display = 'none'; radarMapIframe.style.display = 'block'; locationMapBtn.classList.remove('active'); radarMapBtn.classList.add('active'); });