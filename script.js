// --- CONFIGURATION ---
const OWM_API_KEY = '5a4c5e3313bc10b8a4e086f4c09b522f'; // Your API Key
const cities = {
    "Pune": { lat: 18.5204, lon: 73.8567 },
    "Delhi": { lat: 28.7041, lon: 77.1025 },
    "Mumbai": { lat: 19.0760, lon: 72.8777 },
    "Bengaluru": { lat: 12.9716, lon: 77.5946 },
    "Kolkata": { lat: 22.5726, lon: 88.3639 },
    "Chennai": { lat: 13.0827, lon: 80.2707 },
    "Jaipur": { lat: 26.9124, lon: 75.7873 }
};

// --- DOM ELEMENTS ---
const citySelect = document.getElementById('city-select');
const cityInfo = document.getElementById('city-info');
const dashboardTitle = document.getElementById('dashboard-title');
const aiStatus = document.getElementById('ai-status');
const tempValue = document.getElementById('temp-value');
const humidityValue = document.getElementById('humidity-value');
const rainfallValue = document.getElementById('rainfall-value');
const mainDashboard = document.getElementById('main-dashboard');
const loader = document.getElementById('loader');

let map;
let forecastChart;

// --- AI MODEL ---
function runAIFloodModel(hourlyForecast) {
    const DANGER_THRESHOLD = 100;
    const HIGH_RISK_THRESHOLD = 50;
    const MODERATE_RISK_THRESHOLD = 25;
    
    // OWM provides data every 3 hours, so we need 8 intervals for 24 hours
    const next24hPrecipitation = hourlyForecast.slice(0, 8).reduce((sum, hour) => sum + hour, 0);

    let risk = "Normal";
    let message = `Conditions Normal: Predicted rainfall of ${next24hPrecipitation.toFixed(2)} mm is within the safe limit.`;
    
    if (next24hPrecipitation > DANGER_THRESHOLD) {
        risk = "Danger";
        message = `Extreme Flood Warning: Predicted rainfall of ${next24hPrecipitation.toFixed(2)} mm exceeds the DANGER threshold of ${DANGER_THRESHOLD} mm.`;
    } else if (next24hPrecipitation > HIGH_RISK_THRESHOLD) {
        risk = "High Risk";
        message = `Flood Watch Issued: Predicted rainfall of ${next24hPrecipitation.toFixed(2)} mm exceeds the HIGH RISK threshold of ${HIGH_RISK_THRESHOLD} mm.`;
    } else if (next24hPrecipitation > MODERATE_RISK_THRESHOLD) {
        risk = "Moderate Risk";
        message = `Alert: Predicted rainfall of ${next24hPrecipitation.toFixed(2)} mm exceeds the MODERATE risk threshold of ${MODERATE_RISK_THRESHOLD} mm.`;
    }
    return { risk, message };
}

// --- UI UPDATE FUNCTIONS ---
function updateAIStatus({ risk, message }) {
    aiStatus.textContent = `Status: ${risk}. ${message}`;
    aiStatus.className = 'p-4 rounded-lg text-white mb-6'; // Reset classes
    if (risk === "Danger") aiStatus.classList.add('bg-red-600');
    else if (risk === "High Risk") aiStatus.classList.add('bg-yellow-500');
    else if (risk === "Moderate Risk") aiStatus.classList.add('bg-blue-500');
    else aiStatus.classList.add('bg-green-500');
}

function updateCurrentConditions(temp, humidity, rain) {
    tempValue.textContent = `${temp.toFixed(1)} °C`;
    humidityValue.textContent = `${humidity.toFixed(0)}%`;
    rainfallValue.textContent = `${rain.toFixed(1)} mm`;
}

function updateMap(lat, lon) {
    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
        map.setView([lat, lon], 10);
    } else {
        map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    L.marker([lat, lon]).addTo(map);
}

function updateChart(forecastList) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const labels = forecastList.map(item => new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    const data = forecastList.map(item => item.rain ? item.rain['3h'] : 0);
    
    if (forecastChart) {
        forecastChart.data.labels = labels;
        forecastChart.data.datasets[0].data = data;
        forecastChart.update();
    } else {
        forecastChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Precipitation (mm per 3h)',
                    data: data,
                    backgroundColor: '#004b89',
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// --- DATA FETCHING FUNCTION ---
async function fetchOpenWeatherData(lat, lon) {
    // CORRECTED LINE: This now checks for an empty string or a placeholder, which is correct.
    if (!OWM_API_KEY || OWM_API_KEY === 'YOUR_API_KEY_HERE') { 
        throw new Error('API key is missing. Please add your OpenWeatherMap API key to the script.js file.');
    }
    
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`;
    const response = await fetch(forecastUrl);
    if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
    const data = await response.json();

    const currentConditions = data.list[0];
    const forecastList = data.list;

    const temp = currentConditions.main.temp;
    const humidity = currentConditions.main.humidity;
    const rain = currentConditions.rain ? currentConditions.rain['3h'] : 0;
    const hourlyPrecipitation = forecastList.map(item => item.rain ? item.rain['3h'] : 0);

    updateCurrentConditions(temp, humidity, rain);
    updateChart(forecastList);
    const aiResult = runAIFloodModel(hourlyPrecipitation);
    updateAIStatus(aiResult);
}

// --- MAIN APPLICATION LOGIC ---
async function handleCityChange() {
    const selectedCity = citySelect.value;
    const { lat, lon } = cities[selectedCity];

    dashboardTitle.textContent = `AI Risk Assessment for ${selectedCity}`;
    cityInfo.textContent = `Displaying forecast for ${selectedCity}.`;
    
    mainDashboard.classList.add('hidden');
    loader.classList.remove('hidden');
    loader.style.display = 'flex';

    try {
        await fetchOpenWeatherData(lat, lon);
        updateMap(lat, lon);
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        alert(error.message);
    } finally {
        mainDashboard.classList.remove('hidden');
        loader.classList.add('hidden');
        loader.style.display = 'none';
    }
}

// --- INITIALIZATION ---
function init() {
    for (const city in cities) {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    }
    citySelect.value = "Pune";

    citySelect.addEventListener('change', handleCityChange);
    handleCityChange();
}

init();  