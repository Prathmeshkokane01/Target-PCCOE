// --- DOM ELEMENTS ---
const searchInput = document.getElementById('location-search-input');
const searchResultsContainer = document.getElementById('search-results');
const currentLocationBtn = document.getElementById('current-location-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const dangerListEl = document.getElementById('danger-list');
const warningListEl = document.getElementById('warning-list');
const normalListEl = document.getElementById('normal-list');


// --- CONFIGURATION ---
// The API_KEY is now loaded from config.js
const DISTRICT_COORDINATES = {
    "Delhi": { "lat": 28.61, "lon": 77.23 }, "Mumbai": { "lat": 19.07, "lon": 72.87 }, "Kolkata": { "lat": 22.57, "lon": 88.36 },
    "Chennai": { "lat": 13.08, "lon": 80.27 }, "Bengaluru": { "lat": 12.97, "lon": 77.59 }, "Hyderabad": { "lat": 17.38, "lon": 78.48 },
    "Ahmedabad": { "lat": 23.02, "lon": 72.57 }, "Pune": { "lat": 18.52, "lon": 73.85 }, "Jaipur": { "lat": 26.91, "lon": 75.78 },
    "Lucknow": { "lat": 26.84, "lon": 80.94 }, "Bhopal": { "lat": 23.25, "lon": 77.41 }, "Patna": { "lat": 25.59, "lon": 85.13 },
    "Guwahati": { "lat": 26.14, "lon": 91.73 }, "Thiruvananthapuram": { "lat": 8.52, "lon": 76.93 }, "Srinagar": { "lat": 34.08, "lon": 74.79 }
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
    loadingSpinner.textContent = 'Searching...';
    searchResultsContainer.innerHTML = '';

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, India&format=json&limit=10`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'IN-Monsoon-Watch-App/1.0 (prathmeshkokane01@gmail.com)'
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
    loadingSpinner.textContent = 'Fetching current location...';
    const options = {
        enableHighAccuracy: true,
        timeout: 30000, 
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            loadingSpinner.style.display = 'none';
            redirectToDetails(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
            loadingSpinner.style.display = 'none';
            let message;
            if (err.code === 1) { // PERMISSION_DENIED
                message = "You have denied location access. To use this feature, please enable location permissions for this site in your browser settings.";
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                message = "Your location could not be determined. Please ensure your device's GPS is on.";
            } else if (err.code === 3) { // TIMEOUT
                message = "Location request timed out. Please try again with a better network signal.";
            } else {
                message = `An unknown error occurred.\nERROR(${err.code}): ${err.message}`;
            }
            alert(message);
        },
        options
    );
}

// Fetch risk levels for major cities for the summary
async function fetchDistrictSummaries() {
     if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
        console.error("API Key for OpenWeatherMap is not set in config.js");
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