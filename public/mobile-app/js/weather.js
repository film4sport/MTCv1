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

      // SVG weather icons (reliable rendering on all mobile WebViews)
      var s = function(d) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
      var svgSun = s('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>');
      var svgPartlyCloudy = s('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>');
      var svgCloud = s('<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>');
      var svgRain = s('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>');
      var svgSnow = s('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>');
      var svgFog = s('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7"/><path d="M17 21H9"/>');
      var svgStorm = s('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M13 12l-3 5h4l-3 5"/>');
      var svgHot = s('<path d="M12 12c0-3 2.5-6 2.5-6S17 6 17 9a5 5 0 0 1-10 0c0-3 2.5-6 2.5-6S12 6 12 9"/><path d="M12 12v10"/>');
      var svgCold = s('<path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/>');

      var weatherIcons = {
        0: svgSun, 1: svgPartlyCloudy, 2: svgPartlyCloudy, 3: svgCloud,
        45: svgFog, 48: svgFog,
        51: svgRain, 53: svgRain, 55: svgRain,
        61: svgRain, 63: svgRain, 65: svgRain,
        71: svgSnow, 73: svgSnow, 75: svgSnow,
        80: svgRain, 81: svgRain, 82: svgStorm,
        95: svgStorm
      };

      var temp = Math.round(current.temperature_2m);
      var icon = weatherIcons[current.weather_code] || svgCloud;
      if (temp > 30) icon = svgHot;
      if (temp < -10) icon = svgCold;

      var menuIconEl = document.getElementById('menuWeatherIcon');
      var menuTempEl = document.getElementById('menuWeatherTemp');

      if (menuIconEl) menuIconEl.innerHTML = icon;
      if (menuTempEl) menuTempEl.textContent = temp + '\u00B0C';

    } catch (error) {
      console.warn('Weather fetch failed:', error);
      const menuIconEl = document.getElementById('menuWeatherIcon');
      const menuTempEl = document.getElementById('menuWeatherTemp');
      if (menuIconEl) menuIconEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
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
