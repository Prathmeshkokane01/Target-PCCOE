// --- CONFIGURATION ---
const API_KEY = "5a4c5e3313bc10b8a4e086f4c09b522f";

// --- DOM ELEMENTS ---
const languageSelect = document.getElementById('language-select');
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
const impactContentEl = document.getElementById('impact-content');
const actionsContentEl = document.getElementById('actions-content');
const cropContentEl = document.getElementById('crop-content');
const soilContentEl = document.getElementById('soil-content');

// --- APP STATE ---
let map;
let forecastChart;
let allDistrictsData = [];
let districtMarker;
let chatContext = { district: null, lastResponseData: {} };

// Coordinate mapping for all districts
const DISTRICT_COORDINATES = {
    "Ahmednagar": { "lat": 19.09, "lon": 74.74 }, "Akola": { "lat": 20.70, "lon": 77.01 }, "Amravati": { "lat": 20.93, "lon": 77.75 }, "Beed": { "lat": 18.99, "lon": 75.76 },
    "Bhandara": { "lat": 21.17, "lon": 79.65 }, "Buldhana": { "lat": 20.53, "lon": 76.18 }, "Chandrapur": { "lat": 19.96, "lon": 79.29 }, "Chhatrapati Sambhajinagar": { "lat": 19.87, "lon": 75.34 },
    "Dharashiv": { "lat": 18.17, "lon": 76.04 }, "Dhule": { "lat": 20.90, "lon": 74.77 }, "Gadchiroli": { "lat": 20.18, "lon": 80.00 }, "Gondia": { "lat": 21.46, "lon": 80.20 },
    "Hingoli": { "lat": 19.71, "lon": 77.14 }, "Jalgaon": { "lat": 21.00, "lon": 75.56 }, "Jalna": { "lat": 19.83, "lon": 75.88 }, "Kolhapur": { "lat": 16.70, "lon": 74.24 },
    "Latur": { "lat": 18.40, "lon": 76.58 }, "Mumbai City": { "lat": 19.07, "lon": 72.87 }, "Mumbai Suburban": { "lat": 19.11, "lon": 72.88 }, "Nagpur": { "lat": 21.14, "lon": 79.08 },
    "Nanded": { "lat": 19.13, "lon": 77.32 }, "Nandurbar": { "lat": 21.36, "lon": 74.24 }, "Nashik": { "lat": 19.99, "lon": 73.78 }, "Palghar": { "lat": 19.69, "lon": 72.77 },
    "Parbhani": { "lat": 19.26, "lon": 76.77 }, "Pune": { "lat": 18.52, "lon": 73.85 }, "Raigad": { "lat": 18.52, "lon": 73.18 }, "Ratnagiri": { "lat": 16.99, "lon": 73.31 },
    "Sangli": { "lat": 16.85, "lon": 74.58 }, "Satara": { "lat": 17.68, "lon": 74.01 }, "Sindhudurg": { "lat": 16.35, "lon": 73.55 }, "Solapur": { "lat": 17.68, "lon": 75.90 },
    "Thane": { "lat": 19.21, "lon": 72.97 }, "Wardha": { "lat": 20.74, "lon": 78.60 }, "Washim": { "lat": 20.10, "lon": 77.13 }, "Yavatmal": { "lat": 20.38, "lon": 78.12 }
};

// --- TRANSLATION DATA ---
const translations = {
    en: {
        title: "IN National Monsoon Watch", subtitle: "AI-Powered Decision Support System", select_district: "Select a District",
        ai_assistant: "AI Weather Assistant", ask_placeholder: "Ask about weather or impact...",
        impact_analysis: "Impact Analysis", recommended_actions: "Recommended Actions", crop_advisory: "Crop-Specific Advisory",
        soil_advisory: "Soil & Planting Advisory", historical_incidents: "Historical Incidents",
        risk_summary: "District Risk Summary", red_zone: "Red Zone", yellow_zone: "Yellow Zone", green_zone: "Green Zone",
        detailed_view: "Detailed View for", temperature: "Temperature", humidity: "Humidity", current_rainfall: "Current Rainfall",
        pressure: "Pressure", wind_speed: "Wind Speed", geo_location: "Geographic Location", precip_forecast: "5-Day Precipitation Forecast (mm per 3h)",
        loading: "Loading...", data_unavailable: "Data Unavailable", status: "Status",
        ai_welcome: "Hello! I am a fully operational weather assistant with multilingual support. Ask me anything!",
        status_red: "Status: Red Zone! Predicted rainfall of {value} mm is high.",
        status_yellow: "Status: Yellow Zone! Predicted rainfall of {value} mm is moderate.",
        status_green: "Status: Green Zone. Predicted rainfall of {value} mm is safe.",
        districts: { "Ahmednagar": "Ahmednagar", "Akola": "Akola", "Amravati": "Amravati", "Beed": "Beed", "Bhandara": "Bhandara", "Buldhana": "Buldhana", "Chandrapur": "Chandrapur", "Chhatrapati Sambhajinagar": "Chhatrapati Sambhajinagar", "Dharashiv": "Dharashiv", "Dhule": "Dhule", "Gadchiroli": "Gadchiroli", "Gondia": "Gondia", "Hingoli": "Hingoli", "Jalgaon": "Jalgaon", "Jalna": "Jalna", "Kolhapur": "Kolhapur", "Latur": "Latur", "Mumbai City": "Mumbai City", "Mumbai Suburban": "Mumbai Suburban", "Nagpur": "Nagpur", "Nanded": "Nanded", "Nandurbar": "Nandurbar", "Nashik": "Nashik", "Palghar": "Palghar", "Parbhani": "Parbhani", "Pune": "Pune", "Raigad": "Raigad", "Ratnagiri": "Ratnagiri", "Sangli": "Sangli", "Satara": "Satara", "Sindhudurg": "Sindhudurg", "Solapur": "Solapur", "Thane": "Thane", "Wardha": "Wardha", "Washim": "Washim", "Yavatmal": "Yavatmal" },
        impact_items: {
            danger: ["<li>High risk of urban and riverine flooding.</li>", "<li>Potential for significant crop damage.</li>", "<li>Risk of disruptions to transport and power.</li>"],
            warning: ["<li>Localized waterlogging possible in low-lying areas.</li>", "<li>Some crops may be at risk from excess water.</li>"],
            drought: ["<li>Low rainfall may increase drought stress on crops.</li>"],
            none: ["<li>No significant weather impacts expected.</li>"]
        },
        action_items: {
            danger: ["<li><b>Alert:</b> Avoid travel if possible.</li>", "<li>Check emergency supplies and secure property.</li>", "<li>Monitor official advisories closely.</li>"],
            warning: ["<li><b>Advisory:</b> Be cautious of waterlogged roads.</li>", "<li>Ensure drainage systems are clear.</li>", "<li>Stay informed about weather updates.</li>"],
            normal: ["<li><b>All Clear:</b> Conditions are normal.</li>", "<li>Continue with routine activities.</li>"]
        },
        crop_items: {
            rain_soon: "<li>Upcoming rain: Postpone irrigation, harvesting, and pesticide application.</li>",
            danger: "<li>Ensure proper drainage in fields to prevent waterlogging of crops like soyabean and cotton.</li>",
            dry_spell: "<li>Dry spell expected: Plan for irrigation to protect crops from moisture stress.</li>",
            stable: "<li>Weather conditions are stable for general farm operations.</li>"
        },
        soil_items: {
            temp: "<b>Avg. 5-Day Soil Temp (Est.):</b> {value}°C",
            moisture: "<b>Avg. 5-Day Soil Moisture (Est.):</b> {value}%",
            note: "<i>Note: These are estimations based on atmospheric conditions.</i>"
        }
    },
    mr: {
        title: "राष्ट्रीय मान्सून वॉच", subtitle: "AI-चालित निर्णय समर्थन प्रणाली", select_district: "जिल्हा निवडा",
        ai_assistant: "AI हवामान सहाय्यक", ask_placeholder: "हवामान किंवा परिणामाबद्दल विचारा...",
        impact_analysis: "परिणाम विश्लेषण", recommended_actions: "शिफारस केलेल्या कृती", crop_advisory: "पीक-विशिष्ट सल्ला",
        soil_advisory: "माती आणि लागवड सल्ला", historical_incidents: "मागील घटना",
        risk_summary: "जिल्हा जोखीम सारांश", red_zone: "रेड झोन", yellow_zone: "यलो झोन", green_zone: "ग्रीन झोन",
        detailed_view: "साठी तपशीलवार दृश्य", temperature: "तापमान", humidity: "आर्द्रता", current_rainfall: "सध्याचा पाऊस",
        pressure: "दाब", wind_speed: "वाऱ्याचा वेग", geo_location: "भौगोलिक स्थान", precip_forecast: "५-दिवसांचा पर्जन्यवृष्टी अंदाज (मिमी प्रति ३ तास)",
        loading: "लोड होत आहे...", data_unavailable: "माहिती उपलब्ध नाही", status: "स्थिती",
        ai_welcome: "नमस्कार! मी एक पूर्णपणे कार्यरत हवामान सहाय्यक आहे. मला काहीही विचारा.",
        status_red: "स्थिती: रेड झोन! अंदाजित पाऊस {value} मिमी आहे.",
        status_yellow: "स्थिती: यलो झोन! अंदाजित पाऊस {value} मिमी आहे.",
        status_green: "स्थिती: ग्रीन झोन. अंदाजित पाऊस {value} मिमी सुरक्षित आहे.",
        districts: { "Ahmednagar": "अहमदनगर", "Akola": "अकोला", "Amravati": "अमरावती", "Beed": "बीड", "Bhandara": "भंडारा", "Buldhana": "बुलढाणा", "Chandrapur": "चंद्रपूर", "Chhatrapati Sambhajinagar": "छत्रपती संभाजीनगर", "Dharashiv": "धाराशिव", "Dhule": "धुळे", "Gadchiroli": "गडचिरोली", "Gondia": "गोंदिया", "Hingoli": "हिंगोली", "Jalgaon": "जळगाव", "Jalna": "जालना", "Kolhapur": "कोल्हापूर", "Latur": "लातूर", "Mumbai City": "मुंबई शहर", "Mumbai Suburban": "मुंबई उपनगर", "Nagpur": "नागपूर", "Nanded": "नांदेड", "Nandurbar": "नंदुरबार", "Nashik": "नाशिक", "Palghar": "पालघर", "Parbhani": "परभणी", "Pune": "पुणे", "Raigad": "रायगड", "Ratnagiri": "रत्नागिरी", "Sangli": "सांगली", "Satara": "सातारा", "Sindhudurg": "सिंधुदुर्ग", "Solapur": "सोलापूर", "Thane": "ठाणे", "Wardha": "वर्धा", "Washim": "वाशिम", "Yavatmal": "यवतमाळ" },
        impact_items: {
            danger: ["<li>शहरी आणि नदीच्या पुराचा उच्च धोका.</li>", "<li>पिकांचे मोठे नुकसान होण्याची शक्यता.</li>", "<li>वाहतूक आणि वीजपुरवठ्यात व्यत्यय येण्याचा धोका.</li>"],
            warning: ["<li>सखल भागात स्थानिक पाणी साचण्याची शक्यता.</li>", "<li>जास्त पाण्यामुळे काही पिके धोक्यात येऊ शकतात.</li>"],
            drought: ["<li>कमी पावसामुळे पिकांवर दुष्काळाचा ताण वाढू शकतो.</li>"],
            none: ["<li>कोणत्याही महत्त्वपूर्ण हवामान परिणामांची अपेक्षा नाही.</li>"]
        },
        action_items: {
            danger: ["<li><b>इशारा:</b> शक्य असल्यास प्रवास टाळा.</li>", "<li>आपत्कालीन साहित्य तपासा आणि मालमत्ता सुरक्षित करा.</li>", "<li>अधिकृत सूचनांवर लक्ष ठेवा.</li>"],
            warning: ["<li><b>सल्ला:</b> पाणी साचलेल्या रस्त्यांवर सावधगिरी बाळगा.</li>", "<li>पाणी वाहून नेणारे मार्ग मोकळे असल्याची खात्री करा.</li>", "<li>हवामान अपडेट्सबद्दल माहिती ठेवा.</li>"],
            normal: ["<li><b>सर्व ठीक:</b> परिस्थिती सामान्य आहे.</li>", "<li>नियमित कामे सुरू ठेवा.</li>"]
        },
        crop_items: {
            rain_soon: "<li>आगामी पाऊस: सिंचन, कापणी आणि कीटकनाशक फवारणी पुढे ढकला.</li>",
            danger: "<li>सोयाबीन आणि कापूस यांसारख्या पिकांमध्ये पाणी साचू नये म्हणून शेतात योग्य निचरा सुनिश्चित करा.</li>",
            dry_spell: "<li>कोरड्या हवामानाचा अंदाज: पिकांना ओलाव्याच्या ताणापासून वाचवण्यासाठी सिंचनाचे नियोजन करा.</li>",
            stable: "<li>सर्वसाधारण शेती कामांसाठी हवामान स्थिर आहे.</li>"
        },
        soil_items: {
            temp: "<b>सरासरी ५-दिवसांचे मातीचे तापमान (अंदाजे):</b> {value}°C",
            moisture: "<b>सरासरी ५-दिवसांची मातीची आर्द्रता (अंदाजे):</b> {value}%",
            note: "<i>टीप: हे वातावरणीय परिस्थितीवर आधारित अंदाज आहेत.</i>"
        }
    },
    hi: {
        title: "राष्ट्रीय मानसून वॉच", subtitle: "AI-संचालित निर्णय समर्थन प्रणाली", select_district: "जिला चुनें",
        ai_assistant: "AI मौसम सहायक", ask_placeholder: "मौसम या प्रभाव के बारे में पूछें...",
        impact_analysis: "प्रभाव विश्लेषण", recommended_actions: "अनुशंसित कार्रवाइयां", crop_advisory: "फसल-विशिष्ट सलाह",
        soil_advisory: "मृदा और रोपण सलाह", historical_incidents: "पिछली घटनाएं",
        risk_summary: "जिला जोखिम सारांश", red_zone: "रेड ज़ोन", yellow_zone: "येलो ज़ोन", green_zone: "ग्रीन ज़ोन",
        detailed_view: "के लिए विस्तृत दृश्य", temperature: "तापमान", humidity: "आर्द्रता", current_rainfall: "वर्तमान वर्षा",
        pressure: "दबाव", wind_speed: "हवा की गति", geo_location: "भौगोलिक स्थिति", precip_forecast: "५-दिन की वर्षा का पूर्वानुमान (मिमी प्रति ३ घंटे)",
        loading: "लोड हो रहा है...", data_unavailable: "डेटा उपलब्ध नहीं है", status: "स्थिति",
        ai_welcome: "नमस्ते! मैं एक पूरी तरह से काम करने वाला मौसम सहायक हूँ। मुझसे कुछ भी पूछें।",
        status_red: "स्थिति: रेड ज़ोन! अनुमानित वर्षा {value} मिमी है।",
        status_yellow: "स्थिति: येलो ज़ोन! अनुमानित वर्षा {value} मिमी है।",
        status_green: "स्थिति: ग्रीन ज़ोन। अनुमानित वर्षा {value} मिमी सुरक्षित है।",
        districts: { "Ahmednagar": "अहमदनगर", "Akola": "अकोला", "Amravati": "अमरावती", "Beed": "बीड", "Bhandara": "भंडारा", "Buldhana": "बुलढाणा", "Chandrapur": "चंद्रपुर", "Chhatrapati Sambhajinagar": "छत्रपति संभाजीनगर", "Dharashiv": "धाराशिव", "Dhule": "धुले", "Gadchiroli": "गढ़चिरौली", "Gondia": "गोंदिया", "Hingoli": "हिंगोली", "Jalgaon": "जलगांव", "Jalna": "जालना", "Kolhapur": "कोल्हापुर", "Latur": "लातूर", "Mumbai City": "मुंबई शहर", "Mumbai Suburban": "मुंबई उपनगरीय", "Nagpur": "नागपुर", "Nanded": "नांदेड़", "Nandurbar": "नंदुरबार", "Nashik": "नाशिक", "Palghar": "पालघर", "Parbhani": "परभणी", "Pune": "पुणे", "Raigad": "रायगढ़", "Ratnagiri": "रत्नागिरी", "Sangli": "सांगली", "Satara": "सतारा", "Sindhudurg": "सिंधुदुर्ग", "Solapur": "सोलापुर", "Thane": "ठाणे", "Wardha": "वर्धा", "Washim": "वाशिम", "Yavatmal": "यवतमाल" },
        impact_items: {
            danger: ["<li>शहरी और नदी में बाढ़ का उच्च जोखिम।</li>", "<li>फसलों को महत्वपूर्ण नुकसान की संभावना।</li>", "<li>परिवहन और बिजली में व्यवधान का खतरा।</li>"],
            warning: ["<li>निचले इलाकों में स्थानीय जलभराव संभव है।</li>", "<li>अधिक पानी से कुछ फसलों को खतरा हो सकता है।</li>"],
            drought: ["<li>कम वर्षा से फसलों पर सूखे का तनाव बढ़ सकता है।</li>"],
            none: ["<li>किसी भी महत्वपूर्ण मौसम प्रभाव की उम्मीद नहीं है।</li>"]
        },
        action_items: {
            danger: ["<li><b>चेतावनी:</b> यदि संभव हो तो यात्रा से बचें।</li>", "<li>आपातकालीन आपूर्ति की जांच करें और संपत्ति सुरक्षित करें।</li>", "<li>आधिकारिक सलाह की बारीकी से निगरानी करें।</li>"],
            warning: ["<li><b>सलाह:</b> जलभराव वाली सड़कों से सावधान रहें।</li>", "<li>सुनिश्चित करें कि जल निकासी व्यवस्था साफ है।</li>", "<li>मौसम अपडेट से अवगत रहें।</li>"],
            normal: ["<li><b>सब ठीक है:</b> स्थिति सामान्य है।</li>", "<li>नियमित गतिविधियां जारी रखें।</li>"]
        },
        crop_items: {
            rain_soon: "<li>आगामी बारिश: सिंचाई, कटाई और कीटनाशक के प्रयोग को स्थगित करें।</li>",
            danger: "<li>सोयाबीन और कपास जैसी फसलों में जलभराव को रोकने के लिए खेतों में उचित जल निकासी सुनिश्चित करें।</li>",
            dry_spell: "<li>सूखे की उम्मीद: फसलों को नमी के तनाव से बचाने के लिए सिंचाई की योजना बनाएं।</li>",
            stable: "<li>सामान्य कृषि कार्यों के लिए मौसम की स्थिति स्थिर है।</li>"
        },
        soil_items: {
            temp: "<b>औसत ५-दिवसीय मृदा तापमान (अनुमानित):</b> {value}°C",
            moisture: "<b>औसत ५-दिवसीय मृदा नमी (अनुमानित):</b> {value}%",
            note: "<i>ध्यान दें: ये वायुमंडलीय स्थितियों पर आधारित अनुमान हैं।</i>"
        }
    }
};

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

    translatePage(languageSelect.value); // Initial translation also updates the view
    fetchAndDisplayHistoricalInfo(districtSelect.value);
}

async function getForecastData(districtName) {
    const coords = DISTRICT_COORDINATES[districtName];
    if (!coords) return null;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error(`API error for ${districtName}: ${response.statusText}`);
        const data = await response.json();
        return { name: districtName, risk: getRiskLevel(data), forecastData: data };
    } catch (error) {
        console.error(`Failed to fetch forecast for ${districtName}:`, error);
        return null;
    }
}

async function getCurrentWeatherData(districtName) {
    const coords = DISTRICT_COORDINATES[districtName];
    if (!coords) return null;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error(`API error for ${districtName}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch current weather for ${districtName}:`, error);
        return null;
    }
}

// --- HISTORICAL DATA FUNCTION ---
async function fetchAndDisplayHistoricalInfo(districtName) {
    historicalContentEl.innerHTML = translations[languageSelect.value].loading || "Loading...";
    try {
        const allIncidents = {
            "Pune": [ { title: "Pune flash floods disrupt daily life (Oct 2022)", link: "https://timesofindia.indiatimes.com/city/pune/maharashtra-pune-rains-live-updates-heavy-rainfall-leads-to-waterlogging-in-many-areas-schools-closed/liveblog/94833249.cms", snippet: "Heavy rainfall led to waterlogging in many areas..." }, { title: "Landslide near Katraj Tunnel (Jul 2022)", link: "https://indianexpress.com/article/cities/pune/pune-landslide-katraj-ghat-section-traffic-disrupted-8042571/", snippet: "A minor landslide was reported, affecting traffic..." } ],
            "Hingoli": [ { title: "Two die in Hingoli floods (Aug 2023)", link: "https://www.youtube.com/watch?v=ZxNC7OuCPCM", snippet: "Heavy rains and flooding in the Asna river..." }, { title: "Crops damaged in Hingoli (Jul 2022)", link: "https://timesofindia.indiatimes.com/city/aurangabad/marathwada-receives-12-excess-rain-so-far/articleshow/93032514.cms", snippet: "Over 40,000 hectares of crops were damaged..." } ]
        };
        const incidents = allIncidents[districtName] || [];
        if (incidents.length > 0) {
            let html = '<ul>';
            incidents.slice(0, 5).forEach(item => {
                html += `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a><p>${item.snippet}</p></li>`;
            });
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
    const lang = languageSelect.value;
    const lists = { danger: [], warning: [], normal: [] };
    allDistrictsData.forEach(dist => {
        if (dist) lists[dist.risk.level].push(dist.name);
    });
    dangerListEl.innerHTML = lists.danger.length ? lists.danger.map(d => `<li>${translations[lang].districts[d] || d}</li>`).join('') : `<li>-</li>`;
    warningListEl.innerHTML = lists.warning.length ? lists.warning.map(d => `<li>${translations[lang].districts[d] || d}</li>`).join('') : `<li>-</li>`;
    normalListEl.innerHTML = lists.normal.length ? lists.normal.map(d => `<li>${translations[lang].districts[d] || d}</li>`).join('') : `<li>-</li>`;
}

async function updateDetailedView(districtName) {
    const lang = languageSelect.value;
    const district = allDistrictsData.find(d => d && d.name === districtName);
    const currentData = await getCurrentWeatherData(districtName);
    
    if (!district || !currentData) {
        detailsTitle.textContent = `${translations[lang].data_unavailable} for ${translations[lang].districts[districtName] || districtName}`;
        riskAssessmentEl.textContent = `${translations[lang].status}: ${translations[lang].data_unavailable}`;
        riskAssessmentEl.className = "risk-assessment";
        temperatureEl.textContent = "--";
        humidityEl.textContent = "--";
        rainfallEl.textContent = "--";
        pressureEl.textContent = "--";
        windSpeedEl.textContent = "--";
        impactContentEl.innerHTML = `<p>${translations[lang].data_unavailable}.</p>`;
        actionsContentEl.innerHTML = `<p>${translations[lang].data_unavailable}.</p>`;
        cropContentEl.innerHTML = `<p>${translations[lang].data_unavailable}.</p>`;
        soilContentEl.innerHTML = `<p>${translations[lang].data_unavailable}.</p>`;
        if(map && districtMarker) {
            map.removeLayer(districtMarker);
            districtMarker = null;
        }
        return;
    }
    
    detailsTitle.textContent = `${translations[lang].detailed_view} ${translations[lang].districts[districtName] || districtName}`;
    updateRiskAssessment(district.risk);
    updateCurrentConditions(currentData);
    updateMap(currentData.coord.lat, currentData.coord.lon);
    updateForecastChart(district.forecastData.list);
    updateLegends();
    
    updateImpactAnalysis(district);
    updateRecommendedActions(district.risk);
    updateCropAdvisory(district);
    updateSoilAdvisory(district);
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
    const lang = languageSelect.value;
    riskAssessmentEl.className = 'risk-assessment';
    if (risk.level === 'danger') {
        riskAssessmentEl.textContent = translations[lang].status_red.replace('{value}', risk.value.toFixed(2));
        riskAssessmentEl.classList.add('danger');
    } else if (risk.level === 'warning') {
        riskAssessmentEl.textContent = translations[lang].status_yellow.replace('{value}', risk.value.toFixed(2));
        riskAssessmentEl.classList.add('warning');
    } else {
        riskAssessmentEl.textContent = translations[lang].status_green.replace('{value}', risk.value.toFixed(2));
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
    const lang = languageSelect.value;
    chartLegendEl.innerHTML = `<div class="legend-item"><div class="legend-color danger-bg"></div> ${translations[lang].red_zone} (> 10mm)</div><div class="legend-item"><div class="legend-color warning-bg"></div> ${translations[lang].yellow_zone} (> 5mm)</div><div class="legend-item"><div class="legend-color normal-bg"></div> ${translations[lang].green_zone} (0-5mm)</div>`;
}

// --- ADVANCED FEATURE FUNCTIONS ---
function updateImpactAnalysis(district) {
    const lang = languageSelect.value;
    const impacts = [];
    const forecast = district.forecastData.list;
    let totalRainNext48h = 0;
    forecast.slice(0, 16).forEach(item => {
        totalRainNext48h += item.rain?.['3h'] || 0;
    });

    if (district.risk.level === 'danger') impacts.push(...translations[lang].impact_items.danger);
    if (district.risk.level === 'warning') impacts.push(...translations[lang].impact_items.warning);
    if (totalRainNext48h < 1) impacts.push(...translations[lang].impact_items.drought);
    if (impacts.length === 0) impacts.push(...translations[lang].impact_items.none);
    
    impactContentEl.innerHTML = `<ul>${impacts.join('')}</ul>`;
}

function updateRecommendedActions(risk) {
    const lang = languageSelect.value;
    const actions = translations[lang].action_items[risk.level] || [];
    actionsContentEl.innerHTML = `<ul>${actions.join('')}</ul>`;
}

function updateCropAdvisory(district) {
    const lang = languageSelect.value;
    const advisories = [];
    const forecast = district.forecastData.list;
    let willRainSoon = forecast.slice(0, 8).some(item => (item.rain?.['3h'] || 0) > 1);
    let willBeDry = forecast.slice(0, 16).every(item => (item.rain?.['3h'] || 0) < 0.5);

    if (willRainSoon) advisories.push(translations[lang].crop_items.rain_soon);
    if (district.risk.level === 'danger') advisories.push(translations[lang].crop_items.danger);
    if (willBeDry) advisories.push(translations[lang].crop_items.dry_spell);
    if (advisories.length === 0) advisories.push(translations[lang].crop_items.stable);
    
    cropContentEl.innerHTML = `<ul>${advisories.join('')}</ul>`;
}

function updateSoilAdvisory(district) {
    const lang = languageSelect.value;
    const forecast = district.forecastData.list;
    let avgSoilTemp = forecast.reduce((sum, item) => sum + item.main.temp, 0) / forecast.length;
    let avgSoilMoisture = forecast.reduce((sum, item) => sum + item.main.humidity, 0) / forecast.length;

    soilContentEl.innerHTML = `
        <p>${translations[lang].soil_items.temp.replace('{value}', avgSoilTemp.toFixed(1))}</p>
        <p>${translations[lang].soil_items.moisture.replace('{value}', avgSoilMoisture.toFixed(0))}</p>
        <p style="font-size: 0.8rem; margin-top: 5px;">${translations[lang].soil_items.note}</p>
    `;
}

// --- TRANSLATION FUNCTION ---
function translatePage(lang) {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            const icon = el.querySelector('i');
            const textSpan = el.querySelector('span');
            if (icon && textSpan) {
                 textSpan.textContent = translations[lang][key];
            } else if (icon) {
                el.innerHTML = `<i class="${icon.className}"></i> ${translations[lang][key]}`;
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    updateSummaryLists();
    updateDetailedView(districtSelect.value);
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
    
    if (lowerQuery.includes('impact')) {
        const districtName = extractDistrict(lowerQuery, currentContext);
        const impactList = document.getElementById('impact-content').innerHTML;
        return { response: `Here is the impact analysis for <b>${districtName}</b>:<br>${impactList}`, newContext: { ...currentContext, district: districtName } };
    }
    if (lowerQuery.includes('action')) {
        const districtName = extractDistrict(lowerQuery, currentContext);
        const actionList = document.getElementById('actions-content').innerHTML;
        return { response: `Here are the recommended actions for <b>${districtName}</b>:<br>${actionList}`, newContext: { ...currentContext, district: districtName } };
    }
    if (lowerQuery.includes('crop') || lowerQuery.includes('farm') || lowerQuery.includes('agriculture')) {
        const districtName = extractDistrict(lowerQuery, currentContext);
        const cropList = document.getElementById('crop-content').innerHTML;
        return { response: `Here is the agricultural advisory for <b>${districtName}</b>:<br>${cropList}`, newContext: { ...currentContext, district: districtName } };
    }
    if (lowerQuery.includes('soil')) {
        const districtName = extractDistrict(lowerQuery, currentContext);
        const soilList = document.getElementById('soil-content').innerHTML;
        return { response: `Here is the soil and planting advisory for <b>${districtName}</b>:<br>${soilList}`, newContext: { ...currentContext, district: districtName } };
    }

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
        response = `I can provide a weather forecast, impact analysis, or recommended actions for <b>${districtName}</b>.`;
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
    const sortedDistricts = allDistrictsData.map(d => d.name).sort((a, b) => b.length - a.name.length);
    for (const district of sortedDistricts) {
        if (district && query.includes(district.toLowerCase())) return district;
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
        impact: ['impact', 'consequences'],
        actions: ['actions', 'recommendations', 'should i do'],
        crop: ['crop', 'farm', 'agriculture', 'advisory'],
        soil: ['soil'],
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
    const parts = [],
        risk = districtData.risk;
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
languageSelect.addEventListener('change', (e) => translatePage(e.target.value));
districtSelect.addEventListener('change', (e) => {
    updateDetailedView(e.target.value);
    fetchAndDisplayHistoricalInfo(e.target.value);
    chatContext.district = e.target.value;
});
sendBtn.addEventListener('click', handleUserQuery);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleUserQuery(); });
window.addEventListener('load', fetchAndProcessAllDistricts);