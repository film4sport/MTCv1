/* weather.js - MTC Court */
// ============================================
// WEATHER API (Open-Meteo - Free, No API Key)
// ============================================
(function() {
  'use strict';

  // Private reference to club coordinates from config
  const clubCoordinates = MTC.config.club;

  // Cross-file function (called from auth.js, interactive.js, pull-refresh.js, onclick in retry button)
  /** Fetches weather data from Open-Meteo and updates the weather card */
  MTC.fn.fetchWeather = async function() {
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=' + clubCoordinates.lat + '&longitude=' + clubCoordinates.lon + '&current=temperature_2m,weather_code&timezone=America/Toronto'
      );

      const data = await response.json();
      const current = data.current;

      const weatherIcons = {
        0: '\u2600\uFE0F', 1: '\uD83C\uDF24\uFE0F', 2: '\u26C5', 3: '\u2601\uFE0F',
        45: '\uD83C\uDF2B\uFE0F', 48: '\uD83C\uDF2B\uFE0F',
        51: '\uD83C\uDF27\uFE0F', 53: '\uD83C\uDF27\uFE0F', 55: '\uD83C\uDF27\uFE0F',
        61: '\uD83C\uDF27\uFE0F', 63: '\uD83C\uDF27\uFE0F', 65: '\uD83C\uDF27\uFE0F',
        71: '\uD83C\uDF28\uFE0F', 73: '\uD83C\uDF28\uFE0F', 75: '\u2744\uFE0F',
        80: '\uD83C\uDF26\uFE0F', 81: '\uD83C\uDF26\uFE0F', 82: '\u26C8\uFE0F',
        95: '\u26C8\uFE0F'
      };

      const temp = Math.round(current.temperature_2m);
      let icon = weatherIcons[current.weather_code] || '\uD83C\uDF21\uFE0F';
      if (temp > 30) icon = '\uD83D\uDD25';
      if (temp < -10) icon = '\uD83E\uDD76';

      const menuIconEl = document.getElementById('menuWeatherIcon');
      const menuTempEl = document.getElementById('menuWeatherTemp');

      if (menuIconEl) menuIconEl.textContent = icon;
      if (menuTempEl) menuTempEl.textContent = temp + '\u00B0C';

    } catch (error) {
      console.warn('Weather fetch failed:', error);
      const menuIconEl = document.getElementById('menuWeatherIcon');
      const menuTempEl = document.getElementById('menuWeatherTemp');
      if (menuIconEl) menuIconEl.textContent = '\u26A0\uFE0F';
      if (menuTempEl) menuTempEl.textContent = '--\u00B0C';

      // Show error on weather card if it exists
      const weatherCard = document.getElementById('weatherCard');
      if (weatherCard) {
        let errorDiv = weatherCard.querySelector('.weather-error');
        if (!errorDiv) {
          errorDiv = document.createElement('div');
          errorDiv.className = 'weather-error';
          errorDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>Weather unavailable</span><button class="weather-retry-btn" onclick="fetchWeather()">Retry</button>';
          weatherCard.appendChild(errorDiv);
        }
      }
    }
  };

  // Global alias for onclick handlers and cross-file calls
  window.fetchWeather = MTC.fn.fetchWeather;

  // onclick handler (admin panel)
  window.updateCoordinates = function() {
    const latInput = document.getElementById('adminLat');
    const lonInput = document.getElementById('adminLon');
    const nameInput = document.getElementById('adminLocName');

    if (latInput && lonInput && nameInput) {
      clubCoordinates.lat = parseFloat(latInput.value) || 44.0167;
      clubCoordinates.lon = parseFloat(lonInput.value) || -80.0667;
      clubCoordinates.name = nameInput.value || 'MONO, ONTARIO';

      const locationEl = document.querySelector('.weather-location');
      if (locationEl) locationEl.textContent = clubCoordinates.name;
    }
  };

  // Private helper (only used internally)
  function updateWeatherCardType(weatherCode, temp) {
    const card = document.getElementById('weatherCard');
    if (!card) return;

    card.classList.remove('sunny', 'cloudy', 'rainy', 'cold', 'hot');

    let weatherType = 'sunny';
    if ([71, 73, 75, 77].includes(weatherCode) || temp < 0) {
      weatherType = 'cold';
    } else if ([51, 53, 55, 61, 63, 65, 67, 80, 81, 82, 95].includes(weatherCode)) {
      weatherType = 'rainy';
    } else if ([2, 3, 45, 48].includes(weatherCode)) {
      weatherType = 'cloudy';
    } else if (temp > 30) {
      weatherType = 'hot';
    }

    card.classList.add(weatherType);

    const conditionEl = document.getElementById('weatherCondition');
    if (conditionEl) {
      const conditions = {
        sunny: 'Perfect tennis weather \u2600\uFE0F',
        cloudy: 'Overcast conditions \u2601\uFE0F',
        rainy: 'Rain expected \uD83C\uDF27\uFE0F',
        cold: 'Bundle up! \u2744\uFE0F',
        hot: 'Stay hydrated! \uD83D\uDD25'
      };
      conditionEl.textContent = conditions[weatherType];
    }
  }
})();
