// --- DOM ELEMENTS ---
const searchInput = document.getElementById('location-search-input');
const searchResultsContainer = document.getElementById('search-results');
const currentLocationBtn = document.getElementById('current-location-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const dangerListEl = document.getElementById('danger-list');
const warningListEl = document.getElementById('warning-list');
const normalListEl = document.getElementById('normal-list');


// --- CONFIGURATION ---
const API_KEY = "5a4c5e3313bc10b8a4e086f4c09b522f"; // Your OpenWeatherMap API Key
const DISTRICT_COORDINATES = {
    "Ahmednagar": { "lat": 19.09, "lon": 74.74 }, "Akola": { "lat": 20.70, "lon": 77.01 }, "Amravati": { "lat": 20.93, "lon": 77.75 },
    "Beed": { "lat": 18.99, "lon": 75.76 }, "Bhandara": { "lat": 21.17, "lon": 79.65 }, "Buldhana": { "lat": 20.53, "lon": 76.18 },
    "Chandrapur": { "lat": 19.96, "lon": 79.29 }, "Chhatrapati Sambhajinagar": { "lat": 19.87, "lon": 75.34 }, "Dhule": { "lat": 20.90, "lon": 74.77 },
    "Gadchiroli": { "lat": 20.18, "lon": 80.00 }, "Gondia": { "lat": 21.46, "lon": 80.20 }, "Hingoli": { "lat": 19.71, "lon": 77.14 },
    "Jalgaon": { "lat": 21.00, "lon": 75.56 }, "Jalna": { "lat": 19.83, "lon": 75.88 }, "Kolhapur": { "lat": 16.70, "lon": 74.24 },
    "Latur": { "lat": 18.40, "lon": 76.58 }, "Mumbai City": { "lat": 19.07, "lon": 72.87 }, "Nagpur": { "lat": 21.14, "lon": 79.08 },
    "Nanded": { "lat": 19.13, "lon": 77.32 }, "Nandurbar": { "lat": 21.36, "lon": 74.24 }, "Nashik": { "lat": 19.99, "lon": 73.78 },
    "Palghar": { "lat": 19.69, "lon": 72.77 }, "Parbhani": { "lat": 19.26, "lon": 76.77 }, "Pune": { "lat": 18.52, "lon": 73.85 },
    "Raigad": { "lat": 18.52, "lon": 73.18 }, "Ratnagiri": { "lat": 16.99, "lon": 73.31 }, "Sangli": { "lat": 16.85, "lon": 74.58 },
    "Satara": { "lat": 17.68, "lon": 74.01 }, "Sindhudurg": { "lat": 16.35, "lon": 73.55 }, "Solapur": { "lat": 17.68, "lon": 75.90 },
    "Thane": { "lat": 19.21, "lon": 72.97 }, "Wardha": { "lat": 20.74, "lon": 78.60 }, "Washim": { "lat": 20.10, "lon": 77.13 },
    "Yavatmal": { "lat": 20.38, "lon": 78.12 }
};


// --- FUNCTIONS ---

// Debounce function to limit API calls while typing
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Fetch locations from OpenStreetMap API
async function fetchLocations(query) {
    if (query.length < 3) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.style.display = 'none';
        return;
    }
    loadingSpinner.style.display = 'block';
    searchResultsContainer.innerHTML = '';

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Maharashtra, India&format=json&limit=10`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'IN-Monsoon-Watch-App/1.0 (contact@example.com)'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        displaySearchResults(data);
    } catch (error) {
        console.error("Failed to fetch locations:", error);
        searchResultsContainer.innerHTML = '<div class="search-result-item">Could not fetch results</div>';
        searchResultsContainer.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Display search results from OpenStreetMap
function displaySearchResults(results) {
    searchResultsContainer.innerHTML = ''; 
    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResultsContainer.style.display = 'block';
        return;
    }

    results.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = loc.display_name;
        item.dataset.lat = loc.lat;
        item.dataset.lon = loc.lon;
        item.addEventListener('click', () => {
            redirectToDetails(loc.lat, loc.lon);
        });
        searchResultsContainer.appendChild(item);
    });
    searchResultsContainer.style.display = 'block';
}

// Redirect to the details page with coordinates
function redirectToDetails(lat, lon) {
    window.location.href = `details.html?lat=${lat}&lon=${lon}`;
}

// Get user's current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    loadingSpinner.style.display = 'block';
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            loadingSpinner.style.display = 'none';
            redirectToDetails(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
            loadingSpinner.style.display = 'none';
            alert(`ERROR(${err.code}): ${err.message}\n\nPlease ensure location services are enabled for your browser and device.`);
        },
        options
    );
}

// Fetch risk levels for major districts for the summary
async function fetchDistrictSummaries() {
     if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
        console.error("API Key for OpenWeatherMap is not set.");
        return;
    }
    const lists = { danger: [], warning: [], normal: [] };

    const promises = Object.entries(DISTRICT_COORDINATES).map(async ([name, coords]) => {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`);
            if (!response.ok) return null;
            const data = await response.json();

            let maxRain = 0;
            data.list.slice(0, 8).forEach(item => { 
                const rain3h = item.rain?.['3h'] || 0;
                if (rain3h > maxRain) maxRain = rain3h;
            });

            if (maxRain > 10) return { name, level: 'danger' };
            if (maxRain > 5) return { name, level: 'warning' };
            return { name, level: 'normal' };
        } catch (error) {
            console.error(`Error fetching summary for ${name}:`, error);
            return null;
        }
    });

    const results = await Promise.all(promises);
    results.forEach(res => {
        if (res) lists[res.level].push(res.name);
    });

    dangerListEl.innerHTML = lists.danger.length ? lists.danger.map(d => `<li>${d}</li>`).join('') : `<li>-</li>`;
    warningListEl.innerHTML = lists.warning.length ? lists.warning.map(d => `<li>${d}</li>`).join('') : `<li>-</li>`;
    normalListEl.innerHTML = lists.normal.length ? lists.normal.map(d => `<li>${d}</li>`).join('') : `<li>-</li>`;
}

// --- EVENT LISTENERS ---
searchInput.addEventListener('keyup', debounce(e => fetchLocations(e.target.value), 500));
currentLocationBtn.addEventListener('click', getCurrentLocation);

document.addEventListener('click', (e) => {
    if (!searchResultsContainer.contains(e.target) && e.target !== searchInput) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.style.display = 'none';
    }
});

window.addEventListener('load', fetchDistrictSummaries);