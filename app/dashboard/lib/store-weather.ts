/**
 * Weather data parsing for the dashboard.
 * Extracted from store.tsx for clarity and testability.
 * Maps Open-Meteo weather codes to display conditions.
 */
import type { WeatherData } from './types';

/**
 * Parse Open-Meteo API current weather data into a WeatherData object.
 * Pure function -- no side effects.
 */
export function parseWeatherData(current: {
  temperature_2m: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
  weather_code: number;
}): WeatherData {
  const tempC = Math.round(current.temperature_2m);
  const tempF = Math.round(tempC * 9 / 5 + 32);
  const windKmh = Math.round(current.wind_speed_10m);
  const code = current.weather_code;

  let condition: WeatherData['condition'] = 'sunny';
  let description = 'Clear sky';

  if (code === 0) { condition = 'sunny'; description = 'Clear sky'; }
  else if (code <= 3) { condition = 'cloudy'; description = 'Partly cloudy'; }
  else if (code <= 49) { condition = 'cloudy'; description = 'Foggy'; }
  else if (code <= 59) { condition = 'rainy'; description = 'Drizzle'; }
  else if (code <= 69) { condition = 'rainy'; description = 'Rain'; }
  else if (code <= 79) { condition = 'snowy'; description = 'Snow'; }
  else if (code <= 84) { condition = 'rainy'; description = 'Rain showers'; }
  else if (code <= 94) { condition = 'snowy'; description = 'Snow showers'; }
  else if (code >= 95) { condition = 'rainy'; description = 'Thunderstorm'; }

  // Tennis-specific descriptions
  if (condition === 'sunny' && tempC >= 15 && tempC <= 28 && windKmh < 20) description = 'Perfect tennis weather!';
  else if (condition === 'rainy' || condition === 'snowy') description = 'Consider indoor courts';
  else if (windKmh >= 30) description = 'Very windy — lobs affected';
  else if (tempC < 5) description = 'Bundle up!';
  else if (tempC > 30) description = 'Stay hydrated!';

  return {
    tempC,
    tempF,
    condition,
    wind: windKmh,
    humidity: current.relative_humidity_2m,
    description,
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
