const apiKey = '6c5ae11b212d423bb8064226252005';

async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    alert("Please enter a city name");
    return;
  }

  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=yes`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    showWeather(data);
  } catch (error) {
    document.getElementById('weatherResult').innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

function showWeather(data) {
  const weatherDiv = document.getElementById('weatherResult');
  const weather = data.current;
  const location = data.location;

  const html = `
    <h2>${location.name}, ${location.country}</h2>
    <img src="${weather.condition.icon}" alt="Weather icon">
    <div class="info"><strong>${weather.condition.text}</strong></div>
    <div class="info">🌡️ Temperature: ${weather.temp_c} °C</div>
    <div class="info">💧 Humidity: ${weather.humidity}%</div>
    <div class="info">🌬️ Wind: ${weather.wind_kph} km/h</div>
    <div class="info">🌫️ AQI Enabled: ${data.current.air_quality ? '✅' : '❌'}</div>
  `;
  weatherDiv.innerHTML = html;
}
