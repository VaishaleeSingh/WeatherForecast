const apiKey = '6c5ae11b212d423bb8064226252005';
let currentLocation = null;
let weatherMap = null;
let currentMapLayer = 'temperature';
let calendarData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Weather condition mappings for icons and themes
const weatherConditions = {
  'sunny': { icon: 'fas fa-sun', theme: 'sunny', color: '#ff9800' },
  'clear': { icon: 'fas fa-sun', theme: 'sunny', color: '#ff9800' },
  'partly cloudy': { icon: 'fas fa-cloud-sun', theme: 'cloudy', color: '#90a4ae' },
  'cloudy': { icon: 'fas fa-cloud', theme: 'cloudy', color: '#90a4ae' },
  'overcast': { icon: 'fas fa-cloud', theme: 'cloudy', color: '#90a4ae' },
  'mist': { icon: 'fas fa-smog', theme: 'cloudy', color: '#90a4ae' },
  'fog': { icon: 'fas fa-smog', theme: 'cloudy', color: '#90a4ae' },
  'rain': { icon: 'fas fa-cloud-rain', theme: 'rainy', color: '#2196f3' },
  'drizzle': { icon: 'fas fa-cloud-rain', theme: 'rainy', color: '#2196f3' },
  'light rain': { icon: 'fas fa-cloud-rain', theme: 'rainy', color: '#2196f3' },
  'moderate rain': { icon: 'fas fa-cloud-showers-heavy', theme: 'rainy', color: '#1976d2' },
  'heavy rain': { icon: 'fas fa-cloud-showers-heavy', theme: 'rainy', color: '#1976d2' },
  'snow': { icon: 'fas fa-snowflake', theme: 'snowy', color: '#e3f2fd' },
  'sleet': { icon: 'fas fa-cloud-meatball', theme: 'snowy', color: '#e3f2fd' },
  'thunder': { icon: 'fas fa-bolt', theme: 'stormy', color: '#ff5722' },
  'storm': { icon: 'fas fa-bolt', theme: 'stormy', color: '#ff5722' }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  console.log('Weather app initialized');
  
  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.error('Leaflet is not loaded!');
    return;
  }
  console.log('Leaflet loaded successfully:', L.version);
  
  // Add enter key support for search
  document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      getWeather();
    }
  });
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateInput').value = today;
  
  // Show welcome message
  showWelcomeMessage();
  
  // Initialize calendar
  initializeCalendar();
  
  // Initialize map
  initializeMap();
});

// Initialize calendar
function initializeCalendar() {
  updateCalendarDisplay();
  generateCalendarDays();
}

// Update calendar display
function updateCalendarDisplay() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  document.getElementById('calendarMonth').textContent = 
    `${monthNames[currentMonth]} ${currentYear}`;
}

// Generate calendar days
function generateCalendarDays() {
  const calendarGrid = document.getElementById('calendarGrid');
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  let calendarHTML = '';
  
  // Add day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    calendarHTML += `<div class="calendar-day-header">${day}</div>`;
  });
  
  // Generate calendar days
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = currentDate.getMonth() === currentMonth;
    const isToday = currentDate.toDateString() === new Date().toDateString();
    const dateString = currentDate.toISOString().split('T')[0];
    const weatherData = calendarData[dateString];
    
    let dayClass = 'calendar-day';
    if (!isCurrentMonth) dayClass += ' other-month';
    if (isToday) dayClass += ' today';
    if (weatherData) dayClass += ' has-weather';
    
    calendarHTML += `
      <div class="${dayClass}" onclick="selectDate('${dateString}')">
        <div class="date">${currentDate.getDate()}</div>
        ${weatherData ? `
          <div class="weather-icon">
            <i class="${getWeatherIcon(weatherData.condition)}" style="color: ${getWeatherColor(weatherData.condition)}"></i>
          </div>
          <div class="temp">${Math.round(weatherData.temp)}°</div>
        ` : ''}
      </div>
    `;
  }
  
  calendarGrid.innerHTML = calendarHTML;
}

// Navigate calendar
function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateCalendarDisplay();
  generateCalendarDays();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendarDisplay();
  generateCalendarDays();
}

// Select date from calendar
function selectDate(dateString) {
  document.getElementById('dateInput').value = dateString;
  getWeatherForDate();
}

// Initialize map
function initializeMap() {
  console.log('Initializing map...');
  const mapContainer = document.getElementById('weatherMap');
  
  // Add null check for the map container
  if (!mapContainer) {
    console.error('Weather map element not found');
    return;
  }
  
  console.log('Map container found:', mapContainer);
  console.log('Map container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
  
  // Check if container has dimensions
  if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
    console.warn('Map container has no dimensions, waiting for layout...');
    setTimeout(initializeMap, 100);
    return;
  }
  
  try {
    // Create map
    weatherMap = L.map('weatherMap').setView([0, 0], 2);
    console.log('Map created successfully:', weatherMap);
    
    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(weatherMap);
    console.log('Base tile layer added');
    
    // Add weather overlay layers
    addWeatherLayers();
    console.log('Weather layers added');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Add weather layers to map
function addWeatherLayers() {
  console.log('Adding weather layers...');
  console.log('API Key:', apiKey);
  
  try {
    // Create a simple colored overlay as fallback
    const tempLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      opacity: 0.8
    });
    console.log('Temperature layer created (fallback)');
    
    const precipLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      opacity: 0.8
    });
    console.log('Precipitation layer created (fallback)');
    
    const windLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      opacity: 0.8
    });
    console.log('Wind layer created (fallback)');
    
    const cloudsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      opacity: 0.8
    });
    console.log('Clouds layer created (fallback)');
    
    // Store layers
    weatherMap.weatherLayers = {
      temperature: tempLayer,
      precipitation: precipLayer,
      wind: windLayer,
      clouds: cloudsLayer
    };
    console.log('Weather layers stored');
    
    // Add default layer
    tempLayer.addTo(weatherMap);
    console.log('Default temperature layer added to map');
    
    // Add a marker to show the map is working
    L.marker([0, 0]).addTo(weatherMap)
      .bindPopup('Map is working!')
      .openPopup();
    console.log('Test marker added');
  } catch (error) {
    console.error('Error adding weather layers:', error);
  }
}

// Toggle map layers
function toggleMapLayer(layerType) {
  // Remove all weather layers
  Object.values(weatherMap.weatherLayers).forEach(layer => {
    weatherMap.removeLayer(layer);
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.map-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add selected layer
  weatherMap.weatherLayers[layerType].addTo(weatherMap);
  
  // Add active class to selected button
  document.getElementById(layerType + 'Btn').classList.add('active');
  
  currentMapLayer = layerType;
}

// Show welcome message
function showWelcomeMessage() {
  console.log('Showing welcome message');
  const currentWeatherContent = document.getElementById('currentWeatherContent');
  if (currentWeatherContent) {
    currentWeatherContent.innerHTML = `
      <div class="weather-placeholder">
        <i class="fas fa-cloud-sun weather-icon"></i>
        <h2>Welcome to Weather Forecast Pro</h2>
        <p>Search for a city or use your location to get detailed weather information</p>
        <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">
          Use the calendar to view weather for specific dates
        </p>
      </div>
    `;
  } else {
    console.error('currentWeatherContent element not found');
  }
}

// Get weather data for specific date
async function getWeatherForDate() {
  const city = document.getElementById('cityInput').value.trim();
  const date = document.getElementById('dateInput').value;
  
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  
  if (!date) {
    showError("Please select a date");
    return;
  }
  
  showLoading();
  
  try {
    console.log('Fetching weather data for:', city, 'on', date);
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    let data;
    
    if (selectedDate < today) {
      // Past date - use history API
      console.log('Fetching historical data for past date:', date);
      const response = await fetch(`https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${city}&dt=${date}`);
      
      if (!response.ok) {
        throw new Error("Unable to get historical weather data for this date");
      }
      
      data = await response.json();
    } else {
      // Future date - use forecast API
      console.log('Fetching forecast data for future date:', date);
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=14&aqi=yes`);
      
      if (!response.ok) {
        throw new Error("Unable to get forecast weather data for this date");
      }
      
      data = await response.json();
      
      // Find the specific date in the forecast
      const targetDate = date;
      const forecastDay = data.forecast.forecastday.find(day => day.date === targetDate);
      
      if (!forecastDay) {
        throw new Error("Forecast data not available for this date (max 14 days ahead)");
      }
      
      // Create a mock structure to match historical data format
      data.forecast.forecastday = [forecastDay];
    }
    
    if (data.forecast && data.forecast.forecastday.length > 0) {
      const dayData = data.forecast.forecastday[0];
      showHistoricalWeather(data.location, dayData);
      
      // Update theme with location and time
      updateWeatherTheme(dayData.day.condition.text.toLowerCase(), data.location, new Date(date));
      
      // Update calendar data
      calendarData[date] = {
        temp: dayData.day.avgtemp_c,
        condition: dayData.day.condition.text.toLowerCase()
      };
      generateCalendarDays();
    } else {
      showError("No weather data available for this date");
    }
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    showError(error.message);
  }
}

// Show historical weather
function showHistoricalWeather(location, dayData) {
  const currentWeather = document.getElementById('currentWeather');
  const condition = dayData.day.condition.text.toLowerCase();
  const weatherInfo = weatherConditions[condition] || weatherConditions['clear'];
  
  currentWeather.innerHTML = `
    <h2>${location.name}, ${location.country}</h2>
    <div class="temperature">${Math.round(dayData.day.avgtemp_c)}°C</div>
    <div class="condition">
      <i class="${weatherInfo.icon} weather-icon" style="color: ${weatherInfo.color}"></i>
      ${dayData.day.condition.text}
    </div>
    <div class="weather-details">
      <div class="weather-detail">
        <i class="fas fa-thermometer-half"></i>
        <div class="label">Max Temp</div>
        <div class="value">${Math.round(dayData.day.maxtemp_c)}°C</div>
      </div>
      <div class="weather-detail">
        <i class="fas fa-thermometer-empty"></i>
        <div class="label">Min Temp</div>
        <div class="value">${Math.round(dayData.day.mintemp_c)}°C</div>
      </div>
      <div class="weather-detail">
        <i class="fas fa-tint"></i>
        <div class="label">Humidity</div>
        <div class="value">${dayData.day.avghumidity}%</div>
      </div>
      <div class="weather-detail">
        <i class="fas fa-wind"></i>
        <div class="label">Wind Speed</div>
        <div class="value">${dayData.day.maxwind_kph} km/h</div>
      </div>
      <div class="weather-detail">
        <i class="fas fa-eye"></i>
        <div class="label">Visibility</div>
        <div class="value">${dayData.day.avgvis_km} km</div>
      </div>
      <div class="weather-detail">
        <i class="fas fa-sun"></i>
        <div class="label">UV Index</div>
        <div class="value">${dayData.day.uv}</div>
      </div>
    </div>
  `;
}

// Get weather data
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }

  showLoading();
  
  try {
    console.log('Fetching weather data for:', city);
    
    // Get current weather and forecast
    console.log('Fetching current weather and forecast for:', city);
    
    const [currentData, forecastData] = await Promise.all([
      fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=yes`),
      fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=14&aqi=yes`)
    ]);

    console.log('API responses received - Current:', currentData.status, 'Forecast:', forecastData.status);

    if (!currentData.ok || !forecastData.ok) {
      console.error('API error - Current:', currentData.status, 'Forecast:', forecastData.status);
      throw new Error("City not found or API error");
    }

    const current = await currentData.json();
    const forecast = await forecastData.json();

    console.log('Weather data received:', current);
    console.log('Forecast data received:', forecast);

    // Update UI with weather data
    showCurrentWeather(current);
    showForecast(forecast);
    showAirQuality(current);
    showAdditionalInfo(current);
    updateWeatherTheme(current.current.condition.text.toLowerCase(), current.location, new Date());
    
    // Update map with location
    updateMapLocation(current.location);
    
    // Update calendar with forecast data
    updateCalendarWithForecast(forecast);
    
    // Update date input to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;

  } catch (error) {
    console.error('Error fetching weather:', error);
    showError(error.message);
  }
}

// Update calendar with forecast data
function updateCalendarWithForecast(forecast) {
  calendarData = {};
  
  forecast.forecast.forecastday.forEach(day => {
    calendarData[day.date] = {
      temp: day.day.avgtemp_c,
      condition: day.day.condition.text.toLowerCase()
    };
  });
  
  generateCalendarDays();
}

// Update map location
function updateMapLocation(location) {
  if (!weatherMap) {
    console.warn('Weather map not initialized');
    return;
  }
  
  weatherMap.setView([location.lat, location.lon], 10);
  
  // Add marker for location
  weatherMap.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      weatherMap.removeLayer(layer);
    }
  });
  
  L.marker([location.lat, location.lon])
    .addTo(weatherMap)
    .bindPopup(`<b>${location.name}</b><br>${location.country}`)
    .openPopup();
}

// Get current location weather
async function getCurrentLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by this browser");
    return;
  }

  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      currentLocation = { lat: latitude, lon: longitude };
      
      try {
              const [currentData, forecastData] = await Promise.all([
        fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=yes`),
        fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=14&aqi=yes`)
      ]);

        if (!currentData.ok || !forecastData.ok) {
          throw new Error("Unable to get weather for your location");
        }

        const current = await currentData.json();
        const forecast = await forecastData.json();

        // Update input with location name
        document.getElementById('cityInput').value = current.location.name;

        // Update UI
        showCurrentWeather(current);
        showForecast(forecast);
        showAirQuality(current);
        showAdditionalInfo(current);
        updateWeatherTheme(current.current.condition.text.toLowerCase(), current.location, new Date());
        updateMapLocation(current.location);
        updateCalendarWithForecast(forecast);
        
        // Update date input to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateInput').value = today;

      } catch (error) {
        showError(error.message);
      }
    },
    (error) => {
      showError("Unable to get your location: " + error.message);
    }
  );
}

// Show current weather
function showCurrentWeather(data) {
  const weather = data.current;
  const location = data.location;
  const condition = weather.condition.text.toLowerCase();
  const weatherInfo = weatherConditions[condition] || weatherConditions['clear'];

  const currentWeatherContent = document.getElementById('currentWeatherContent');
  if (currentWeatherContent) {
    currentWeatherContent.innerHTML = `
      <h2>${location.name}, ${location.country}</h2>
      <div class="temperature">${Math.round(weather.temp_c)}°C</div>
      <div class="condition">
        <i class="${weatherInfo.icon} weather-icon" style="color: ${weatherInfo.color}"></i>
        ${weather.condition.text}
      </div>
      <div class="weather-details">
        <div class="weather-detail">
          <i class="fas fa-thermometer-half"></i>
          <div class="label">Feels Like</div>
          <div class="value">${Math.round(weather.feelslike_c)}°C</div>
        </div>
        <div class="weather-detail">
          <i class="fas fa-tint"></i>
          <div class="label">Humidity</div>
          <div class="value">${weather.humidity}%</div>
        </div>
        <div class="weather-detail">
          <i class="fas fa-wind"></i>
          <div class="label">Wind Speed</div>
          <div class="value">${weather.wind_kph} km/h</div>
        </div>
        <div class="weather-detail">
          <i class="fas fa-eye"></i>
          <div class="label">Visibility</div>
          <div class="value">${weather.vis_km} km</div>
        </div>
        <div class="weather-detail">
          <i class="fas fa-compress-arrows-alt"></i>
          <div class="label">Pressure</div>
          <div class="value">${weather.pressure_mb} mb</div>
        </div>
        <div class="weather-detail">
          <i class="fas fa-sun"></i>
          <div class="label">UV Index</div>
          <div class="value">${weather.uv}</div>
        </div>
      </div>
    `;
  }
}

// Show 5-day forecast
function showForecast(data) {
  console.log('ShowForecast called with data:', data);
  
  if (!data || !data.forecast || !data.forecast.forecastday) {
    console.error('Invalid forecast data:', data);
    return;
  }
  
  const forecast = data.forecast.forecastday;
  const forecastContainer = document.getElementById('forecastContainer');
  
  if (!forecastContainer) {
    console.error('Forecast container not found');
    return;
  }
  
  console.log('Forecast data:', forecast);
  console.log('Number of forecast days:', forecast.length);
  
  const forecastHTML = forecast.slice(0, 5).map(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const condition = day.day.condition.text.toLowerCase();
    const weatherInfo = weatherConditions[condition] || weatherConditions['clear'];
    
    console.log('Processing day:', dayName, 'with condition:', condition);
    
    return `
      <div class="forecast-day">
        <div class="day">${dayName}</div>
        <i class="${weatherInfo.icon}" style="color: ${weatherInfo.color}; font-size: 2rem;"></i>
        <div class="temp">${Math.round(day.day.avgtemp_c)}°C</div>
        <div class="condition">${day.day.condition.text}</div>
        <div style="font-size: 0.8rem; color: #999; margin-top: 5px;">
          ${Math.round(day.day.mintemp_c)}° / ${Math.round(day.day.maxtemp_c)}°
        </div>
      </div>
    `;
  }).join('');
  
  console.log('Generated forecast HTML:', forecastHTML);
  
  if (forecastHTML.trim() === '') {
    forecastContainer.innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <i class="fas fa-calendar-alt" style="font-size: 2rem; margin-bottom: 10px; color: #999;"></i>
        <p>No forecast data available</p>
        <p style="font-size: 0.9rem;">Please search for a city to see the 5-day forecast</p>
      </div>
    `;
  } else {
    forecastContainer.innerHTML = forecastHTML;
  }
}

// Show air quality information in new section
function showAirQuality(data) {
  const airQuality = data.current.air_quality;
  const airQualitySection = document.getElementById('airQuality');
  
  // Add null check for the element
  if (!airQualitySection) {
    console.warn('Air quality element not found');
    return;
  }
  
  if (!airQuality) {
    airQualitySection.innerHTML = `
      <div class="air-quality-content">
        <div class="air-quality-display">
          <div class="aqi-main">
            <div class="aqi-circle aqi-good">--</div>
            <div class="aqi-label">N/A</div>
          </div>
          <div class="aqi-details">
            <div class="aqi-detail">
              <span class="label">PM2.5</span>
              <span class="value">--</span>
            </div>
            <div class="aqi-detail">
              <span class="label">PM10</span>
              <span class="value">--</span>
            </div>
            <div class="aqi-detail">
              <span class="label">O3</span>
              <span class="value">--</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const aqi = airQuality['us-epa-index'];
  let aqiClass = 'aqi-good';
  let aqiText = 'Good';
  
  if (aqi >= 1 && aqi <= 2) {
    aqiClass = 'aqi-good';
    aqiText = 'Good';
  } else if (aqi >= 3 && aqi <= 4) {
    aqiClass = 'aqi-moderate';
    aqiText = 'Moderate';
  } else if (aqi >= 5 && aqi <= 6) {
    aqiClass = 'aqi-unhealthy';
    aqiText = 'Unhealthy';
  } else if (aqi >= 7 && aqi <= 8) {
    aqiClass = 'aqi-very-unhealthy';
    aqiText = 'Very Unhealthy';
  } else if (aqi >= 9) {
    aqiClass = 'aqi-hazardous';
    aqiText = 'Hazardous';
  }

  airQualitySection.innerHTML = `
    <div class="air-quality-content">
      <div class="air-quality-display">
        <div class="aqi-main">
          <div class="aqi-circle ${aqiClass}">${aqi}</div>
          <div class="aqi-label">${aqiText}</div>
        </div>
        <div class="aqi-details">
          <div class="aqi-detail">
            <span class="label">PM2.5</span>
            <span class="value">${airQuality.pm2_5?.toFixed(1) || '--'}</span>
          </div>
          <div class="aqi-detail">
            <span class="label">PM10</span>
            <span class="value">${airQuality.pm10?.toFixed(1) || '--'}</span>
          </div>
          <div class="aqi-detail">
            <span class="label">O3</span>
            <span class="value">${airQuality.o3?.toFixed(1) || '--'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Weather alerts function removed as requested

// Show additional weather information
function showAdditionalInfo(data) {
  const weather = data.current;
  const location = data.location;
  const additionalInfo = document.getElementById('additionalInfo');
  
  // Add null check for the element
  if (!additionalInfo) {
    console.warn('Additional info element not found');
    return;
  }
  
  additionalInfo.innerHTML = `
    <h3><i class="fas fa-info-circle"></i> Additional Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <i class="fas fa-map-marker-alt"></i>
        <div class="label">Coordinates</div>
        <div class="value">${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}</div>
      </div>
      <div class="info-item">
        <i class="fas fa-clock"></i>
        <div class="label">Local Time</div>
        <div class="value">${location.localtime}</div>
      </div>
      <div class="info-item">
        <i class="fas fa-arrow-up"></i>
        <div class="label">Wind Direction</div>
        <div class="value">${weather.wind_dir}</div>
      </div>
      <div class="info-item">
        <i class="fas fa-tachometer-alt"></i>
        <div class="label">Wind Gust</div>
        <div class="value">${weather.gust_kph} km/h</div>
      </div>
      <div class="info-item">
        <i class="fas fa-cloud"></i>
        <div class="label">Cloud Cover</div>
        <div class="value">${weather.cloud}%</div>
      </div>
      <div class="info-item">
        <i class="fas fa-temperature-high"></i>
        <div class="label">Dew Point</div>
        <div class="value">${weather.dewpoint_c}°C</div>
      </div>
    </div>
  `;
}

// Update weather theme based on conditions, time, and location
function updateWeatherTheme(condition, location = null, time = null) {
  const body = document.body;
  const now = time || new Date();
  const hour = now.getHours();
  const isNight = hour < 6 || hour > 18;
  const isDawn = hour >= 5 && hour < 7;
  const isDusk = hour >= 17 && hour < 19;
  const isDay = hour >= 7 && hour < 17;
  
  // Remove existing theme classes
  body.classList.remove(
    'sunny', 'cloudy', 'rainy', 'snowy', 'stormy',
    'night', 'dawn', 'dusk', 'day',
    'hilly', 'ocean', 'plain', 'mountain', 'forest', 'desert',
    'sunrise', 'sunset', 'midnight', 'twilight'
  );
  
  // Determine base weather theme
  let weatherTheme = 'default';
  if (condition.includes('sun') || condition.includes('clear')) {
    weatherTheme = 'sunny';
  } else if (condition.includes('cloud') || condition.includes('overcast') || condition.includes('mist') || condition.includes('fog')) {
    weatherTheme = 'cloudy';
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    weatherTheme = 'rainy';
  } else if (condition.includes('snow') || condition.includes('sleet')) {
    weatherTheme = 'snowy';
  } else if (condition.includes('thunder') || condition.includes('storm')) {
    weatherTheme = 'stormy';
  }
  
  // Determine time-based theme
  let timeTheme = '';
  if (isNight) {
    timeTheme = 'night';
    if (hour >= 23 || hour < 2) timeTheme = 'midnight';
    else if (hour >= 2 && hour < 5) timeTheme = 'twilight';
  } else if (isDawn) {
    timeTheme = 'dawn';
  } else if (isDusk) {
    timeTheme = 'dusk';
  } else if (isDay) {
    timeTheme = 'day';
  }
  
  // Determine location-based theme (if location data is available)
  let locationTheme = '';
  if (location) {
    // Simple location detection based on coordinates
    // This is a basic implementation - in a real app, you'd use a geocoding API
    const lat = location.lat;
    const lon = location.lon;
    
    // Detect coastal areas (simple approximation)
    if (Math.abs(lat) < 30 && Math.abs(lon) < 180) {
      // This is a very basic coastal detection - real implementation would use elevation data
      locationTheme = 'ocean';
    }
    // Detect mountainous regions (simple approximation)
    else if (Math.abs(lat) > 30 && Math.abs(lat) < 60) {
      locationTheme = 'mountain';
    }
    // Detect forest regions (simple approximation)
    else if (Math.abs(lat) > 45 && Math.abs(lat) < 70) {
      locationTheme = 'forest';
    }
    // Detect desert regions (simple approximation)
    else if (Math.abs(lat) > 20 && Math.abs(lat) < 35) {
      locationTheme = 'desert';
    }
    // Default to hilly/plain regions
    else {
      locationTheme = 'hilly';
    }
  } else {
    locationTheme = 'hilly'; // Default
  }
  
  // Apply the most specific theme combination
  const themeClasses = [weatherTheme, timeTheme, locationTheme].filter(Boolean);
  themeClasses.forEach(theme => body.classList.add(theme));
  
  // Update theme display
  updateThemeDisplay(weatherTheme, timeTheme, locationTheme);
  
  // Apply dynamic theme
  applyDynamicTheme(weatherTheme, timeTheme, locationTheme, condition);
}

// Apply dynamic CSS variables for advanced theming
function applyDynamicTheme(weatherTheme, timeTheme, locationTheme, condition) {
  const root = document.documentElement;

  // Enhanced base colors for different weather conditions with more attractive combinations
  const weatherColors = {
    sunny: {
      primary: '#ff6b6b',
      secondary: '#ffd93d',
      accent: '#ff9a9e',
      overlay: 'radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 182, 193, 0.3) 0%, transparent 50%)'
    },
    cloudy: {
      primary: '#74b9ff',
      secondary: '#a29bfe',
      accent: '#6c5ce7',
      overlay: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 40%)'
    },
    rainy: {
      primary: '#2d3436',
      secondary: '#74b9ff',
      accent: '#0984e3',
      overlay: 'radial-gradient(circle at 50% 50%, rgba(116, 185, 255, 0.2) 0%, transparent 70%)'
    },
    snowy: {
      primary: '#dfe6e9',
      secondary: '#74b9ff',
      accent: '#a8e6cf',
      overlay: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.8) 0%, transparent 30%), radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.6) 0%, transparent 30%)'
    },
    stormy: {
      primary: '#2d3436',
      secondary: '#0984e3',
      accent: '#6c5ce7',
      overlay: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(116, 185, 255, 0.15) 0%, transparent 50%)'
    }
  };

  // Enhanced time-based color adjustments - Static only to prevent fluctuation
  const timeColors = {
    night: {
      overlay: 'rgba(0,0,0,0.3)',
      stars: 'radial-gradient(2px 2px at 20px 30px, #eee, transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent), radial-gradient(2px 2px at 160px 30px, #ddd, transparent)',
      effect: 'none'
    },
    midnight: {
      overlay: 'rgba(0,0,0,0.5)',
      stars: 'radial-gradient(2px 2px at 20px 30px, #fff, transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,1), transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.8), transparent), radial-gradient(2px 2px at 160px 30px, #fff, transparent), radial-gradient(1px 1px at 200px 60px, rgba(255,255,255,0.9), transparent)',
      effect: 'none'
    },
    dawn: {
      overlay: 'radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
      stars: 'none',
      effect: 'none'
    },
    dusk: {
      overlay: 'radial-gradient(circle at 30% 30%, rgba(255, 107, 107, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255, 217, 61, 0.3) 0%, transparent 50%)',
      stars: 'none',
      effect: 'none'
    },
    day: {
      overlay: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(116, 185, 255, 0.2) 0%, transparent 40%)',
      stars: 'none',
      effect: 'none'
    }
  };

  // Enhanced location-based patterns - Static only to prevent fluctuation
  const locationPatterns = {
    ocean: {
      pattern: 'radial-gradient(circle at 30% 20%, rgba(0,150,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,100,200,0.3) 0%, transparent 50%), linear-gradient(45deg, transparent 40%, rgba(0,150,255,0.1) 50%, transparent 60%)',
      effect: 'none'
    },
    mountain: {
      pattern: 'radial-gradient(circle at 50% 50%, rgba(139,69,19,0.3) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(205,133,63,0.2) 0%, transparent 60%), linear-gradient(135deg, transparent 30%, rgba(139,69,19,0.1) 50%, transparent 70%)',
      effect: 'none'
    },
    forest: {
      pattern: 'radial-gradient(circle at 40% 40%, rgba(34,139,34,0.3) 0%, transparent 50%), radial-gradient(circle at 60% 60%, rgba(144,238,144,0.2) 0%, transparent 50%), linear-gradient(90deg, transparent 40%, rgba(34,139,34,0.1) 50%, transparent 60%)',
      effect: 'none'
    },
    desert: {
      pattern: 'radial-gradient(circle at 30% 30%, rgba(218,165,32,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(244,164,96,0.3) 0%, transparent 50%), linear-gradient(45deg, transparent 30%, rgba(218,165,32,0.1) 50%, transparent 70%)',
      effect: 'none'
    },
    hilly: {
      pattern: 'radial-gradient(circle at 50% 50%, rgba(144,238,144,0.3) 0%, transparent 60%), radial-gradient(circle at 25% 75%, rgba(152,251,152,0.2) 0%, transparent 60%), linear-gradient(135deg, transparent 40%, rgba(144,238,144,0.1) 50%, transparent 60%)',
      effect: 'none'
    }
  };

  const weatherColor = weatherColors[weatherTheme] || weatherColors.sunny;
  const timeColor = timeColors[timeTheme] || timeColors.day;
  const locationPattern = locationPatterns[locationTheme] || locationPatterns.hilly;

  // Apply enhanced CSS variables
  root.style.setProperty('--weather-primary', weatherColor.primary);
  root.style.setProperty('--weather-secondary', weatherColor.secondary);
  root.style.setProperty('--weather-accent', weatherColor.accent);
  root.style.setProperty('--time-overlay', timeColor.overlay);
  root.style.setProperty('--time-stars', timeColor.stars);
  root.style.setProperty('--location-pattern', locationPattern.pattern);

  // Enhanced special effects based on conditions
  if (condition.includes('rain') || condition.includes('drizzle')) {
    root.style.setProperty('--rain-effect', 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.8\'/%3E%3C/svg%3E")');
  } else {
    root.style.setProperty('--rain-effect', 'none');
  }

  if (condition.includes('snow') || condition.includes('sleet')) {
    root.style.setProperty('--snow-effect', 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M50 20 L55 35 L70 35 L60 45 L65 60 L50 50 L35 60 L40 45 L30 35 L45 35 Z\' fill=\'%23ffffff\' opacity=\'0.9\'/%3E%3C/svg%3E")');
  } else {
    root.style.setProperty('--snow-effect', 'none');
  }

  if (timeTheme === 'night' || timeTheme === 'midnight') {
    root.style.setProperty('--stars-effect', timeColor.stars);
  } else {
    root.style.setProperty('--stars-effect', 'none');
  }

  // No animations applied - static only for screen stability
  // Removed all animation applications to prevent fluctuation
}

// Update theme display in debug panel
function updateThemeDisplay(weatherTheme, timeTheme, locationTheme) {
  const themeElement = document.getElementById('currentTheme');
  if (themeElement) {
    const themes = [weatherTheme, timeTheme, locationTheme].filter(Boolean);
    const themeNames = {
      sunny: '☀️ Sunny',
      cloudy: '☁️ Cloudy',
      rainy: '🌧️ Rainy',
      snowy: '❄️ Snowy',
      stormy: '⛈️ Stormy',
      night: '🌙 Night',
      midnight: '🌌 Midnight',
      dawn: '🌅 Dawn',
      dusk: '🌆 Dusk',
      day: '☀️ Day',
      ocean: '🌊 Ocean',
      mountain: '🏔️ Mountain',
      forest: '🌲 Forest',
      desert: '🏜️ Desert',
      hilly: '🏞️ Hilly'
    };
    
    const displayThemes = themes.map(theme => themeNames[theme] || theme).join(' + ');
    themeElement.textContent = displayThemes || 'Default';
  }
}

// Show loading state
function showLoading() {
  const currentWeatherContent = document.getElementById('currentWeatherContent');
  if (currentWeatherContent) {
    currentWeatherContent.innerHTML = `
      <div class="weather-placeholder">
        <div class="loading"></div>
        <p>Loading weather data...</p>
      </div>
    `;
  }
  
  // Clear other sections
  const airQuality = document.getElementById('airQuality');
  const forecastContainer = document.getElementById('forecastContainer');
  const additionalInfo = document.getElementById('additionalInfo');
  
  if (airQuality) airQuality.innerHTML = '';
  if (forecastContainer) forecastContainer.innerHTML = '';
  if (additionalInfo) additionalInfo.innerHTML = '';
}

// Show error message
function showError(message) {
  const currentWeatherContent = document.getElementById('currentWeatherContent');
  if (currentWeatherContent) {
    currentWeatherContent.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

// Utility function to format time
function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Utility function to get weather icon
function getWeatherIcon(condition) {
  const conditionLower = condition.toLowerCase();
  return weatherConditions[conditionLower]?.icon || 'fas fa-cloud';
}

// Utility function to get weather color
function getWeatherColor(condition) {
  const conditionLower = condition.toLowerCase();
  return weatherConditions[conditionLower]?.color || '#90a4ae';
}

// Test theme function for manual theme selection
function testTheme() {
  const themeSelect = document.getElementById('themeSelect');
  const selectedTheme = themeSelect.value;
  
  if (!selectedTheme) {
    // Reset to auto mode
    return;
  }
  
  const body = document.body;
  
  // Remove all existing theme classes
  body.classList.remove(
    'sunny', 'cloudy', 'rainy', 'snowy', 'stormy',
    'night', 'dawn', 'dusk', 'day',
    'hilly', 'ocean', 'plain', 'mountain', 'forest', 'desert',
    'sunrise', 'sunset', 'midnight', 'twilight'
  );
  
  // Parse the selected theme
  const [weather, time, location] = selectedTheme.split('-');
  
  // Apply the selected themes
  if (weather) body.classList.add(weather);
  if (time) body.classList.add(time);
  if (location) body.classList.add(location);
  
  // Update theme display
  updateThemeDisplay(weather, time, location);
  
  // Apply dynamic theme
  applyDynamicTheme(weather, time, location, weather);
}

// Auto-refresh weather every 30 minutes
setInterval(() => {
  const cityInput = document.getElementById('cityInput');
  if (cityInput.value.trim()) {
    getWeather();
  }
}, 30 * 60 * 1000);
