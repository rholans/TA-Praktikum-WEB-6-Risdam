let useCelsius = true;
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

let map = L.map("map").setView([-6.2, 106.8], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
let mapMarker;

function updateMap(lat, lon){
    map.setView([lat, lon], 10);
    if(mapMarker) map.removeLayer(mapMarker);
    mapMarker = L.marker([lat, lon]).addTo(map);
}

function emoji(code){
    if(code==0) return "☀️";
    if(code<=3) return "⛅";
    if(code>=51 && code<=67) return "🌧️";
    if(code>=71 && code<=77) return "❄️";
    if(code>=95) return "⛈️";
    return "☁️";
}


async function fetchWeather(city){
    document.getElementById("statusText").textContent = "Loading...";

    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`)
    .then(r=>r.json());

    const g = geo.results[0];
    const lat = g.latitude, lon = g.longitude;

    const weather = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    ).then(r=>r.json());

    showWeather(weather, g.name, g.country);
    showForecast(weather);
    updateMap(lat, lon);

    document.getElementById("lastUpdate").textContent =
        "Last update: " + new Date().toLocaleString();
    document.getElementById("statusText").textContent = "Ready";
}

function convert(c){
    return useCelsius ? c : (c * 9/5 + 32);
}

function showWeather(w, city, country){
    document.getElementById("locationName").textContent = `${city}, ${country}`;
    document.getElementById("weatherTime").textContent = new Date().toLocaleString();

    document.getElementById("weatherIcon").textContent = emoji(w.current_weather.weathercode);
    document.getElementById("temperature").textContent =
        convert(w.current_weather.temperature).toFixed(1) + (useCelsius?"°C":"°F");

    document.getElementById("weatherDesc").textContent = "Current weather";

    document.getElementById("humidity").textContent = "N/A";
    document.getElementById("windSpeed").textContent = w.current_weather.windspeed + " km/h";
    document.getElementById("feelsLike").textContent = "N/A";
    document.getElementById("pressure").textContent = "N/A";
    document.getElementById("visibility").textContent = "N/A";
    document.getElementById("cloudiness").textContent = "N/A";
}

function showForecast(w){
    const grid = document.getElementById("forecastGrid");
    grid.innerHTML = "";
    for(let i=0;i<5;i++){
        grid.innerHTML += `
        <div class="forecast-card">
            <strong>${w.daily.time[i]}</strong><br>
            <div style="font-size:2rem">${emoji(w.daily.weathercode[i])}</div>
            <div>Min: ${convert(w.daily.temperature_2m_min[i]).toFixed(1)}°</div>
            <div>Max: ${convert(w.daily.temperature_2m_max[i]).toFixed(1)}°</div>
        </div>`;
    }
}


function updateFavorites(){
    const box = document.getElementById("favoritesList");
    box.innerHTML = "";
    favorites.forEach(c=>{
        const el=document.createElement("span");
        el.className="favorite-city";
        el.textContent=c;
        el.onclick=()=>fetchWeather(c);
        box.appendChild(el);
    });
}

document.getElementById("saveFavorite").onclick = ()=>{
    const city = document.getElementById("locationName").textContent.split(",")[0];
    if(city && !favorites.includes(city)){
        favorites.push(city);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        updateFavorites();
    }
};

document.getElementById("cityInput").addEventListener("input", async function(){
    const q = this.value.trim();
    if(q.length < 2) return;

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}`);
    const data = await res.json();

    const list = document.getElementById("suggestions");
    list.innerHTML = "";

    data.results?.slice(0,5).forEach(c=>{
        const li=document.createElement("li");
        li.textContent=`${c.name}, ${c.country}`;
        li.onclick=()=>{
            document.getElementById("cityInput").value=c.name;
            list.innerHTML="";
            fetchWeather(c.name);
        };
        list.appendChild(li);
    });
});

document.getElementById("searchBtn").onclick = ()=>{
    const city = document.getElementById("cityInput").value;
    if(city) fetchWeather(city);
};

document.getElementById("unitToggle").onclick=()=>{
    useCelsius = !useCelsius;
    document.getElementById("unitToggle").textContent = useCelsius?"°C":"°F";
    fetchWeather(document.getElementById("locationName").textContent.split(",")[0]);
};

document.getElementById("themeToggle").onclick=()=>{
    document.body.classList.toggle("light");
};

document.getElementById("refreshBtn").onclick=()=>{
    fetchWeather(document.getElementById("locationName").textContent.split(",")[0]);
};

setInterval(()=>{
    const city=document.getElementById("locationName").textContent.split(",")[0];
    if(city) fetchWeather(city);
},300000);


updateFavorites();
fetchWeather("Jakarta");
