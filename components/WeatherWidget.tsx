'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface WeatherWidgetProps {
  city?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ city = 'Colombo' }) => {
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    precipitation: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Try OpenWeatherMap API first
        const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        
        if (openWeatherKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city},LK&appid=${openWeatherKey}&units=metric`
          );

          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(data.main.temp),
              condition: data.weather[0].main,
              precipitation: data.clouds?.all || 0
            });
            setLoading(false);
            return;
          }
        }

        // Fallback: Use Google Maps Geocoding + OpenWeatherMap with Google API key
        // Note: Google doesn't have direct weather API, but we can use it for location services
        // For now, use fallback data
        setWeather({
          temp: 30,
          condition: 'Partly Cloudy',
          precipitation: 10
        });
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback
        setWeather({
          temp: 30,
          condition: 'Partly Cloudy',
          precipitation: 10
        });
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [city]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4">
      <div className="flex items-center justify-between mb-2">
         <span className="text-xs text-[#5F6368]">{city}</span>
         {weather && (
           <span className="text-xs text-[#5F6368]">Precipitation: {weather.precipitation}%</span>
         )}
      </div>
      {weather && (
        <div className="flex items-center gap-4">
           <div className="text-4xl font-normal text-[#202124]">{weather.temp}°C</div>
           <div className="text-sm text-[#202124]">{weather.condition}</div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;

