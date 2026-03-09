'use client';

import { useDerived } from '../lib/store';

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
};

export default function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const { weather } = useDerived();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl">{WEATHER_ICONS[weather.condition] || '⏳'}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1a1f12' }}>
            {weather.tempC}°C <span className="font-normal" style={{ color: '#6b7a3d' }}>/ {weather.tempF}°F</span>
          </p>
          <p className="text-xs" style={{ color: '#6b7a3d' }}>{weather.description}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs" style={{ color: '#6b7a3d' }}>💨 {weather.wind} km/h</p>
          <p className="text-xs" style={{ color: '#6b7a3d' }}>💧 {weather.humidity}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: '#faf8f3', borderColor: '#e0dcd3' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{WEATHER_ICONS[weather.condition] || '⏳'}</span>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#1a1f12' }}>
              {weather.tempC}°C <span className="text-lg font-normal" style={{ color: '#6b7a3d' }}>/ {weather.tempF}°F</span>
            </p>
            <p className="text-sm font-medium" style={{ color: weather.condition === 'sunny' ? '#6b7a3d' : '#b45309' }}>
              {weather.description}
            </p>
          </div>
        </div>
        <div className="text-right text-sm" style={{ color: '#6b7a3d' }}>
          <p>💨 {weather.wind} km/h</p>
          <p>💧 {weather.humidity}%</p>
          {weather.lastUpdated && (
            <p className="text-xs mt-1" style={{ color: 'rgba(107, 122, 61, 0.6)' }}>Updated {weather.lastUpdated}</p>
          )}
        </div>
      </div>
    </div>
  );
}
