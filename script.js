// --- CONFIGURATION ---
const API_KEY = "5a4c5e3313bc10b8a4e086f4c09b522f"; // ⚠️ PASTE YOUR OWN API KEY HERE!

// --- DOM ELEMENTS ---
const districtSelect = document.getElementById('district-select');
const detailsTitle = document.getElementById('details-title');
const dangerListEl = document.getElementById('danger-list');
const warningListEl = document.getElementById('warning-list');
const normalListEl = document.getElementById('normal-list');
const riskAssessmentEl = document.getElementById('risk-assessment');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const rainfallEl = document.getElementById('rainfall');
const forecastCanvas = document.getElementById('forecast-chart');
const mapEl = document.getElementById('map');
const mapLegendEl = document.getElementById('map-legend');
const chartLegendEl = document.getElementById('chart-legend');

// --- APP STATE ---
let map;
let forecastChart;
let cityMarker;
let allDistrictsData = [];

// --- MAP MARKER ICONS ---
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const yellowIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

// --- CORE LOGIC ---
async function fetchAndProcessAllDistricts() {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        alert("Please enter your OpenWeatherMap API key in script.js");
        return;
    }
    const districtOptions = Array.from(districtSelect.options);
    const promises = districtOptions.map(option => getSingleDistrictData(option.value));
    const results = await Promise.allSettled(promises);
    allDistrictsData = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
    updateSummaryLists();
    updateDetailedView(districtSelect.value);
}

async function getSingleDistrictData(districtName) {
    let apiDistrictName = districtName;
    if (districtName === "Dharashiv") apiDistrictName = "Osmanabad";
    else if (districtName === "Chhatrapati Sambhajinagar") apiDistrictName = "Aurangabad";
    else if (districtName === "Mumbai City" || districtName === "Mumbai Suburban") apiDistrictName = "Mumbai";
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${apiDistrictName}&appid=${API_KEY}&units=metric`);
    if (!response.ok) { throw new Error(`Failed for ${districtName}`); }
    const data = await response.json();
    const risk = getRiskLevel(data);
    return { name: districtName, risk: risk, data: data };
}

// --- UI UPDATE FUNCTIONS ---
function updateSummaryLists() {
    const dangerDistricts = [], warningDistricts = [], normalDistricts = [];
    allDistrictsData.forEach(district => {
        if (district.risk.level === 'danger') dangerDistricts.push(district.name);
        else if (district.risk.level === 'warning') warningDistricts.push(district.name);
        else normalDistricts.push(district.name);
    });
    dangerListEl.innerHTML = dangerDistricts.length ? dangerDistricts.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
    warningListEl.innerHTML = warningDistricts.length ? warningDistricts.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
    normalListEl.innerHTML = normalDistricts.length ? normalDistricts.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
}

function updateDetailedView(districtName) {
    const district = allDistrictsData.find(d => d.name === districtName);
    if (!district) { console.error("No data found for", districtName); return; }
    const { data, risk } = district;
    detailsTitle.textContent = `Detailed View for ${districtName}`;
    updateRiskAssessment(risk);
    updateCurrentConditions(data);
    updateMap(data.city.coord.lat, data.city.coord.lon, risk.level);
    updateForecastChart(data.list);
    updateLegends();
}

function getRiskLevel(data) {
    let maxRain = 0;
    for (let i = 0; i < 8 && i < data.list.length; i++) {
        const rain3h = data.list[i].rain?.['3h'] || 0;
        if (rain3h > maxRain) maxRain = rain3h;
    }
    if (maxRain > 10) return { level: 'danger', value: maxRain };
    if (maxRain > 5) return { level: 'warning', value: maxRain };
    return { level: 'normal', value: maxRain };
}

function updateRiskAssessment(risk) {
    riskAssessmentEl.className = 'risk-assessment';
    if (risk.level === 'danger') {
        riskAssessmentEl.textContent = `Status: Danger! Predicted rainfall of ${risk.value.toFixed(2)} mm is high. Potential flood risk.`;
        riskAssessmentEl.classList.add('danger');
    } else if (risk.level === 'warning') {
        riskAssessmentEl.textContent = `Status: Warning! Predicted rainfall of ${risk.value.toFixed(2)} mm is moderate. Monitor conditions.`;
        riskAssessmentEl.classList.add('warning');
    } else {
        riskAssessmentEl.textContent = `Status: Normal. Conditions Normal. Predicted rainfall of ${risk.value.toFixed(2)} mm is within the safe limit.`;
    }
}

function updateCurrentConditions(data) {
    const currentData = data.list[0];
    temperatureEl.textContent = `${currentData.main.temp.toFixed(1)} °C`;
    humidityEl.textContent = `${currentData.main.humidity} %`;
    rainfallEl.textContent = `${(currentData.rain?.['1h'] || 0).toFixed(1)} mm`;
}

function updateMap(lat, lon, riskLevel) {
    if (!map) {
        map = L.map(mapEl).setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }
    if (cityMarker) map.removeLayer(cityMarker);
    let icon = riskLevel === 'danger' ? redIcon : riskLevel === 'warning' ? yellowIcon : greenIcon;
    cityMarker = L.marker([lat, lon], { icon: icon }).addTo(map);
}

function updateForecastChart(forecastList) {
    const labels = forecastList.map(item => {
        const date = new Date(item.dt * 1000);
        return [date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }), date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })];
    });
    const data = forecastList.map(item => item.rain?.['3h'] || 0);
    if (forecastChart) {
        forecastChart.data.labels = labels;
        forecastChart.data.datasets[0].data = data;
        forecastChart.update();
    } else {
        forecastChart = new Chart(forecastCanvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Precipitation (mm)', data, backgroundColor: 'rgba(0, 123, 255, 0.5)', borderColor: 'rgba(0, 123, 255, 1)', borderWidth: 1 }] },
            options: { scales: { y: { beginAtZero: true } }, responsive: true, maintainAspectRatio: false }
        });
    }
}

function updateLegends() {
    mapLegendEl.innerHTML = `<div class="legend-item"><div class="legend-color" style="background-color: #dc3545;"></div> Danger</div><div class="legend-item"><div class="legend-color" style="background-color: #ffc107;"></div> Warning</div><div class="legend-item"><div class="legend-color" style="background-color: #28a745;"></div> Normal</div>`;
    chartLegendEl.innerHTML = `<div class="legend-item"><div class="legend-color" style="background-color: #dc3545;"></div> Danger (> 10mm)</div><div class="legend-item"><div class="legend-color" style="background-color: #ffc107;"></div> Warning (> 5mm)</div><div class="legend-item"><div class="legend-color" style="background-color: #28a745;"></div> Normal (0-5mm)</div>`;
}

// --- EVENT LISTENERS ---
districtSelect.addEventListener('change', () => {
    updateDetailedView(districtSelect.value);
});

// --- INITIAL LOAD ---
window.addEventListener('load', () => {
    fetchAndProcessAllDistricts();
});