// --- CONFIGURATION ---
const API_KEY = "5a4c5e3313bc10b8a4e086f4c09b522f";

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
const pressureEl = document.getElementById('pressure');
const windSpeedEl = document.getElementById('wind-speed');
const forecastCanvas = document.getElementById('forecast-chart');
const mapEl = document.getElementById('map');
const chartLegendEl = document.getElementById('chart-legend');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const historicalContentEl = document.getElementById('historical-content');

// --- APP STATE ---
let map;
let forecastChart;
let allDistrictsData = [];
let districtMarker;
let chatContext = { district: null, lastResponseData: {} };

// --- CORE APPLICATION LOGIC ---

async function fetchAndProcessAllDistricts() {
    if (API_KEY === "YOUR_API_KEY_HERE" || !API_KEY) {
        alert("Please enter a valid OpenWeatherMap API key in script.js");
        return;
    }
    const promises = Array.from(districtSelect.options).map(option => getForecastData(option.value));
    const results = await Promise.allSettled(promises);
    allDistrictsData = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    
    if (allDistrictsData.length === 0) {
        detailsTitle.textContent = "Error: Could not load weather data. Check API key.";
        return;
    }

    updateSummaryLists();
    updateDetailedView(districtSelect.value);
    fetchAndDisplayHistoricalInfo(districtSelect.value);
    addMessageToChatbox("Hello! I now provide live data and explanations for all weather metrics.", 'ai');
}

async function getForecastData(districtName) {
    const districtApiMap = { "Dharashiv": "Osmanabad", "Chhatrapati Sambhajinagar": "Aurangabad", "Mumbai City": "Mumbai", "Mumbai Suburban": "Mumbai" };
    const apiDistrictName = districtApiMap[districtName] || districtName;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${apiDistrictName}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error(`API error for ${districtName}: ${response.statusText}`);
        const data = await response.json();
        return { name: districtName, risk: getRiskLevel(data), forecastData: data };
    } catch (error) {
        console.error(`Failed to fetch forecast for ${districtName}:`, error);
        return null;
    }
}

async function getCurrentWeatherData(districtName) {
    const districtApiMap = { "Dharashiv": "Osmanabad", "Chhatrapati Sambhajinagar": "Aurangabad", "Mumbai City": "Mumbai", "Mumbai Suburban": "Mumbai" };
    const apiDistrictName = districtApiMap[districtName] || districtName;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${apiDistrictName}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error(`API error for ${districtName}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch current weather for ${districtName}:`, error);
        return null;
    }
}

// --- HISTORICAL DATA FUNCTION ---
async function fetchAndDisplayHistoricalInfo(districtName) {
    historicalContentEl.innerHTML = "Searching for recent incidents...";
    try {
        const allIncidents = {
            "Pune": [
                { title: "Pune flash floods disrupt daily life", link: "https://timesofindia.indiatimes.com/city/pune/maharashtra-pune-rains-live-updates-heavy-rainfall-leads-to-waterlogging-in-many-areas-schools-closed/liveblog/94833249.cms", snippet: "Heavy rainfall led to waterlogging in many areas, forcing school closures and traffic diversions..." },
                { title: "Landslide near Pune's Katraj Tunnel", link: "https://indianexpress.com/article/cities/pune/pune-landslide-katraj-ghat-section-traffic-disrupted-8042571/", snippet: "A minor landslide was reported near the new Katraj tunnel, affecting traffic flow on the highway..." },
                { title: "IMD issues red alert for Pune", link: "https://www.hindustantimes.com/cities/pune-news/pune-sees-wettest-july-day-in-5-years-imd-issues-red-alert-for-4-days-101657567784803.html", snippet: "The India Meteorological Department (IMD) issued a red alert for Pune district amid heavy rainfall predictions." },
                { title: "Mutha river swells in Pune", link: "https://www.youtube.com/watch?v=5-8W8mZ8xO4", snippet: "Water levels in the Mutha river rose significantly following continuous rain, putting low-lying areas on alert." },
                { title: "Pune traffic police issue advisory", link: "https://www.punekarnews.in/pune-traffic-police-issue-advisory-amidst-heavy-rains-in-the-city/", snippet: "Advisories were issued to commuters to avoid waterlogged streets and navigate safely during the monsoon." }
            ],
            "Hingoli": [
                { title: "Two die in Hingoli floods", link: "https://www.youtube.com/watch?v=ZxNC7OuCPCM", snippet: "Heavy rains and flooding in the Asna river led to the tragic death of two individuals..." },
                { title: "Crops damaged in Hingoli due to excess rain", link: "https://timesofindia.indiatimes.com/city/aurangabad/marathwada-receives-12-excess-rain-so-far/articleshow/93032514.cms", snippet: "Over 40,000 hectares of crops like soyabean and cotton were damaged due to severe weather conditions." },
                { title: "Flood situation in Hingoli remains grim", link: "https://www.lokmat.com/hingoli/flood-situation-in-hingoli-remains-grim-a511-news-marathi-video-b53/", snippet: "The flood situation in several villages of Hingoli district remains critical as water has entered many houses." },
                { title: "NDRF teams deployed in Marathwada", link: "https://www.ndtv.com/india-news/maharashtra-rains-heavy-rain-in-marathwada-nanded-hingoli-districts-ndrf-teams-deployed-3199852", snippet: "National Disaster Response Force (NDRF) teams were deployed in regions including Hingoli to assist with rescue operations." },
                { title: "Maharashtra floods: Hingoli district affected", link: "https://www.republicworld.com/india-news/general-news/maharashtra-floods-cm-eknath-shinde-to-tour-gadchiroli-other-rain-hit-districts-articleshow.html", snippet: "Hingoli was listed among the districts severely affected by heavy rains and flooding in the state." }
            ]
        };
        const incidents = allIncidents[districtName] || [];
        if (incidents.length > 0) {
            let html = '<ul>';
            incidents.slice(0, 5).forEach(item => { html += `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a><p>${item.snippet}</p></li>`; });
            html += '</ul>';
            historicalContentEl.innerHTML = html;
        } else {
            historicalContentEl.innerHTML = "<p>No recent major incidents found in our records for this district.</p>";
        }
    } catch (error) {
        console.error("Failed to fetch historical data:", error);
        historicalContentEl.innerHTML = "<p>Could not load historical data at this time.</p>";
    }
}

// --- UI UPDATE FUNCTIONS ---
function updateSummaryLists() {
    const lists = { danger: [], warning: [], normal: [] };
    allDistrictsData.forEach(dist => {
        if (dist) lists[dist.risk.level].push(dist.name);
    });
    dangerListEl.innerHTML = lists.danger.length ? lists.danger.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
    warningListEl.innerHTML = lists.warning.length ? lists.warning.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
    normalListEl.innerHTML = lists.normal.length ? lists.normal.map(d => `<li>${d}</li>`).join('') : '<li>None</li>';
}

async function updateDetailedView(districtName) {
    const district = allDistrictsData.find(d => d && d.name === districtName);
    const currentData = await getCurrentWeatherData(districtName);
    
    if (!district || !currentData) {
        detailsTitle.textContent = `Could not load data for ${districtName}`;
        return;
    }
    
    detailsTitle.textContent = `Detailed View for ${districtName}`;
    updateRiskAssessment(district.risk);
    updateCurrentConditions(currentData);
    updateMap(currentData.coord.lat, currentData.coord.lon);
    updateForecastChart(district.forecastData.list);
    updateLegends();
}

function getRiskLevel(data) {
    let maxRain = 0;
    const next24h = data.list.slice(0, 8);
    for (const item of next24h) {
        const rain3h = item.rain?.['3h'] || 0;
        if (rain3h > maxRain) maxRain = rain3h;
    }
    if (maxRain > 10) return { level: 'danger', value: maxRain };
    if (maxRain > 5) return { level: 'warning', value: maxRain };
    return { level: 'normal', value: maxRain };
}

function updateRiskAssessment(risk) {
    riskAssessmentEl.className = 'risk-assessment';
    if (risk.level === 'danger') {
        riskAssessmentEl.textContent = `Status: Red Zone! Predicted rainfall of ${risk.value.toFixed(2)} mm is high.`;
        riskAssessmentEl.classList.add('danger');
    } else if (risk.level === 'warning') {
        riskAssessmentEl.textContent = `Status: Yellow Zone! Predicted rainfall of ${risk.value.toFixed(2)} mm is moderate.`;
        riskAssessmentEl.classList.add('warning');
    } else {
        riskAssessmentEl.textContent = `Status: Green Zone. Predicted rainfall of ${risk.value.toFixed(2)} mm is safe.`;
    }
}

function updateCurrentConditions(current) {
    temperatureEl.textContent = `${current.main.temp.toFixed(1)} °C`;
    humidityEl.textContent = `${current.main.humidity} %`;
    rainfallEl.textContent = `${(current.rain?.['1h'] || 0).toFixed(1)} mm`;
    pressureEl.textContent = `${current.main.pressure} hPa`;
    windSpeedEl.textContent = `${(current.wind.speed * 3.6).toFixed(1)} km/h`;
}

function updateMap(lat, lon) {
    if (!map) {
        map = L.map(mapEl).setView([lat, lon], 9);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    } else {
        map.setView([lat, lon], 9);
    }
    if (districtMarker) {
        districtMarker.setLatLng([lat, lon]);
    } else {
        districtMarker = L.marker([lat, lon]).addTo(map);
    }
}

function updateForecastChart(forecastList) {
    const labels = forecastList.map(item => new Date(item.dt * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + " " + new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    const data = forecastList.map(item => item.rain?.['3h'] || 0);
    if (forecastChart) {
        forecastChart.data.labels = labels;
        forecastChart.data.datasets[0].data = data;
        forecastChart.update();
    } else {
        forecastChart = new Chart(forecastCanvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Precipitation (mm)', data, backgroundColor: 'rgba(0, 123, 255, 0.5)', borderWidth: 1 }] },
            options: { scales: { y: { beginAtZero: true } }, responsive: true, maintainAspectRatio: false }
        });
    }
}

function updateLegends() {
    chartLegendEl.innerHTML = `<div class="legend-item"><div class="legend-color danger-bg"></div> Red Zone (> 10mm)</div><div class="legend-item"><div class="legend-color warning-bg"></div> Yellow Zone (> 5mm)</div><div class="legend-item"><div class="legend-color normal-bg"></div> Green Zone (0-5mm)</div>`;
}

// --- ADVANCED CONVERSATIONAL AI ---
function addMessageToChatbox(message, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message', `${sender}-message`);
    messageEl.innerHTML = message;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleUserQuery() {
    const query = chatInput.value.trim();
    if (!query) return;
    addMessageToChatbox(query, 'user');
    chatInput.value = "";
    setTimeout(() => {
        generateAiResponse(query, chatContext).then(result => {
            addMessageToChatbox(result.response, 'ai');
            chatContext = result.newContext;
        });
    }, 500);
}

async function generateAiResponse(query, currentContext) {
    const lowerQuery = query.toLowerCase();
    const confirmationResponse = handleConfirmation(lowerQuery, currentContext);
    if (confirmationResponse) {
        return { response: confirmationResponse, newContext: currentContext };
    }
    const districtName = extractDistrict(lowerQuery, currentContext);
    const dateInfo = extractDateInfo(lowerQuery);
    const metrics = extractMetrics(lowerQuery);
    let newContext = { ...currentContext, district: districtName };
    const districtData = allDistrictsData.find(d => d && d.name === districtName);
    if (!districtData) {
        return { response: `I couldn't find data for "${districtName}".`, newContext };
    }
    let response;
    let responseData = {};
    if (dateInfo.type !== 'none') {
        const forecastResult = handleForecast(districtData, dateInfo, metrics);
        response = forecastResult.response;
        responseData = forecastResult.data;
    } else if (metrics.length > 0) {
        const currentResult = await handleCurrentWeather(districtData, metrics);
        response = currentResult.response;
        responseData = currentResult.data;
    } else {
        response = `I can provide a weather forecast or current details for <b>${districtName}</b>. What would you like to know?`;
    }
    newContext.lastResponseData = responseData;
    return { response, newContext };
}

function handleConfirmation(query, context) {
    const lastData = context.lastResponseData;
    if (!lastData) return null;
    if ((query.includes('danger') || query.includes('red zone')) && (query.includes('so') || query.includes('is it'))) {
        if (lastData.risk === 'danger') {
            return `Yes, that's correct. The risk level for <b>${context.district}</b> is currently in the Red Zone.`;
        } else {
            const zone = lastData.risk === 'warning' ? 'Yellow Zone' : 'Green Zone';
            return `No, the current risk level for <b>${context.district}</b> is '${zone}'.`;
        }
    }
    return null;
}

function extractDistrict(query, context) {
    const sortedDistricts = [...allDistrictsData].sort((a, b) => b.name.length - a.name.length);
    for (const district of sortedDistricts) {
        if (district && query.includes(district.name.toLowerCase())) return district.name;
    }
    if (query.includes('mumbai')) return 'Mumbai City';
    if (context.district) return context.district;
    return districtSelect.value;
}

function extractDateInfo(query) {
    const multiDayMatch = query.match(/(?:next\s*)?(\d+)\s*day/);
    if (multiDayMatch) return { type: 'range', value: parseInt(multiDayMatch[1], 10) };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (query.includes('today')) return { type: 'day', value: today };
    if (query.match(/tomorrow|tomarrow|tomorow/)) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { type: 'day', value: tomorrow };
    }
    return { type: 'none' };
}

function extractMetrics(query) {
    const metrics = new Set();
    const synonyms = {
        temperature: ['temperature', 'temp', 'hot', 'cold', 'degrees'],
        humidity: ['humidity', 'humid', 'moisture'],
        rain: ['rain', 'rainfall', 'precipitation'],
        risk: ['risk', 'danger', 'warning', 'red zone', 'yellow zone', 'green zone'],
        pressure: ['pressure'],
        wind: ['wind', 'windy'],
        general: ['weather', 'status', 'conditions', 'information', 'forecast']
    };
    for (const metric in synonyms) {
        if (synonyms[metric].some(word => query.includes(word))) {
            if (metric === 'general') {
                metrics.add('temperature').add('humidity').add('rain').add('risk').add('pressure').add('wind');
            } else {
                metrics.add(metric);
            }
        }
    }
    return Array.from(metrics);
}

function handleForecast(districtData, dateInfo, metrics) {
    const isRange = dateInfo.type === 'range';
    const numDays = isRange ? dateInfo.value : 1;
    if (numDays <= 0 || numDays > 5) return { response: "Please ask for a forecast between 1 and 5 days.", data: {} };
    const dailyData = {};
    for (const item of districtData.forecastData.list) {
        const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyData[dateKey]) dailyData[dateKey] = { temps: [], rains: [], dateObj: new Date(item.dt * 1000) };
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].rains.push(item.rain?.['3h'] || 0);
    }
    let relevantDays = Object.values(dailyData);
    if (isRange) {
        relevantDays = relevantDays.slice(0, numDays);
    } else {
        relevantDays = relevantDays.filter(day => day.dateObj.getDate() === dateInfo.value.getDate());
    }
    if (relevantDays.length === 0) return { response: `I don't have a forecast for <b>${districtData.name}</b> on that date.`, data: {} };
    let response = `Here is the forecast for <b>${districtData.name}</b>:`;
    const responseData = {};
    for (const day of relevantDays) {
        const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;
        const totalRain = day.rains.reduce((a, b) => a + b, 0);
        const dateString = day.dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
        response += `<br><br><b>${dateString}</b>:`;
        if (metrics.includes('temperature') || metrics.length === 0) {
            response += `<br>- Avg. Temp: <b>${avgTemp.toFixed(1)}°C</b>`;
            responseData.temperature = avgTemp;
        }
        if (metrics.includes('rain') || metrics.length === 0) {
            response += `<br>- Total Rain: <b>${totalRain.toFixed(2)} mm</b>`;
            responseData.rain = totalRain;
        }
    }
    return { response, data: responseData };
}

async function handleCurrentWeather(districtData, metrics) {
    if (metrics.length === 0) metrics.push('temperature', 'humidity', 'rain', 'risk', 'pressure', 'wind');
    const current = await getCurrentWeatherData(districtData.name);
    if (!current) {
        return { response: `Could not fetch live data for <b>${districtData.name}</b>.`, data: {} };
    }
    const parts = [], risk = districtData.risk;
    const responseData = {};
    const riskZone = risk.level === 'danger' ? 'Red Zone' : risk.level === 'warning' ? 'Yellow Zone' : 'Green Zone';

    if (metrics.includes('temperature')) { parts.push(`- Temperature: <b>${current.main.temp.toFixed(1)}°C</b>`); responseData.temperature = current.main.temp; }
    if (metrics.includes('humidity')) { parts.push(`- Humidity: <b>${current.main.humidity}%</b>`); responseData.humidity = current.main.humidity; }
    if (metrics.includes('rain')) { parts.push(`- Rainfall (last 1h): <b>${(current.rain?.['1h'] || 0).toFixed(1)} mm</b>`); responseData.rain = (current.rain?.['1h'] || 0); }
    if (metrics.includes('risk')) { parts.push(`- 24h Risk Level: <b>${riskZone}</b>`); responseData.risk = risk.level; }
    if (metrics.includes('pressure')) { parts.push(`- Pressure: <b>${current.main.pressure} hPa</b>`); responseData.pressure = current.main.pressure; }
    if (metrics.includes('wind')) { parts.push(`- Wind Speed: <b>${(current.wind.speed * 3.6).toFixed(1)} km/h</b>`); responseData.wind = current.wind.speed; }
    
    const response = `Current status for <b>${districtData.name}</b>:<br>${parts.join('<br>')}`;
    return { response, data: responseData };
}

// --- EVENT LISTENERS ---
districtSelect.addEventListener('change', (e) => {
    updateDetailedView(e.target.value);
    fetchAndDisplayHistoricalInfo(e.target.value);
    chatContext.district = e.target.value;
});
sendBtn.addEventListener('click', handleUserQuery);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleUserQuery(); });
window.addEventListener('load', fetchAndProcessAllDistricts);