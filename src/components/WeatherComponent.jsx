import React, { useState } from "react";
import "./WeatherComponent.css";

// Add Font Awesome CDN in the head
if (!document.getElementById('font-awesome')) {
  const link = document.createElement('link');
  link.id = 'font-awesome';
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
  document.head.appendChild(link);
}

// const API_KEY = process.env.API_KEY;
const API_KEY = "1635890035cbba097fd5c26c8ea672a1";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// Weather background mapping
const getWeatherBackground = (weatherId) => {
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return 'weather-bg-thunderstorm';
  }
  // Drizzle or Rain
  if (weatherId >= 300 && weatherId < 600) {
    return 'weather-bg-rain';
  }
  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    return 'weather-bg-snow';
  }
  // Atmosphere (mist, fog, etc.)
  if (weatherId >= 700 && weatherId < 800) {
    return 'weather-bg-atmosphere';
  }
  // Clear
  if (weatherId === 800) {
    return 'weather-bg-clear';
  }
  // Clouds
  if (weatherId > 800) {
    return 'weather-bg-clouds';
  }
  return 'weather-bg-default';
};

// Cloud description mapping
const getCloudDescription = (description, cloudCover) => {
  switch (description.toLowerCase()) {
    case 'few clouds':
      return `Scattered clouds (${cloudCover}% coverage)`;
    case 'scattered clouds':
      return `Partly cloudy (${cloudCover}% coverage)`;
    case 'broken clouds':
      return `Mostly cloudy (${cloudCover}% coverage)`;
    case 'overcast clouds':
      return `Complete cloud cover (${cloudCover}% coverage)`;
    default:
      return description;
  }
};

// Custom cloud icon mapping
const getCloudIcon = (weather) => {
  const description = weather.weather[0].description.toLowerCase();
  const cloudCover = weather.clouds?.all || 0;
  const baseUrl = 'https://openweathermap.org/img/wn/';
  
  if (description.includes('cloud')) {
    if (cloudCover < 25) return `${baseUrl}02d@2x.png`; // few clouds
    if (cloudCover < 50) return `${baseUrl}03d@2x.png`; // scattered clouds
    if (cloudCover < 85) return `${baseUrl}04d@2x.png`; // broken clouds
    return `${baseUrl}04d@2x.png`; // overcast clouds
  }
  
  return `${baseUrl}${weather.weather[0].icon}@2x.png`;
};

const WeatherCard = ({ weather, isCurrent = false }) => {
  const cloudDescription = getCloudDescription(
    weather.weather[0].description,
    weather.clouds?.all || 0
  );

  return (
    <div className={`forecast-card ${isCurrent ? 'current' : ''}`}>
      {!isCurrent && <h3>{new Date(weather.dt * 1000).toLocaleDateString()}</h3>}
      <div className="weather-icon-container">
        <img
          src={getCloudIcon(weather)}
          alt={weather.weather[0].description}
          className="weather-icon"
        />
        {weather.weather[0].description.includes('cloud') && (
          <div className="cloud-coverage">
            <i className="fas fa-cloud"></i>
            <span>{weather.clouds?.all || 0}% coverage</span>
          </div>
        )}
      </div>
      <div className="temperature">
        <p className="temp-main">{weather.main.temp.toFixed(1)}°C</p>
        <p className="temp-feel">Feels like: {weather.main.feels_like.toFixed(1)}°C</p>
      </div>
      <div className="weather-details">
        <p className="weather-description">{cloudDescription}</p>
        <div className="weather-info">
          <div className="weather-info-item">
            <i className="fas fa-tint"></i>
            <div className="weather-info-item-content">
              <span>{weather.main.humidity}%</span>
              <span>Humidity</span>
            </div>
          </div>
          <div className="weather-info-item">
            <i className="fas fa-wind"></i>
            <div className="weather-info-item-content">
              <span>{weather.wind.speed} m/s</span>
              <span>Wind</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherComponent = () => {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = async (cityName) => {
    if (!cityName.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch current weather
      const weatherResponse = await fetch(
        `${WEATHER_URL}?q=${encodeURIComponent(cityName.trim())}&appid=${API_KEY}&units=metric`
      );
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        throw new Error(
          errorData.message || `Error: ${weatherResponse.status} ${weatherResponse.statusText}`
        );
      }
      
      const weatherResult = await weatherResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${FORECAST_URL}?q=${encodeURIComponent(cityName.trim())}&appid=${API_KEY}&units=metric`
      );
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json();
        throw new Error(
          errorData.message || `Error: ${forecastResponse.status} ${forecastResponse.statusText}`
        );
      }
      
      const forecastResult = await forecastResponse.json();
      
      // Filter forecasts to get one per day, excluding today
      const today = new Date().setHours(0, 0, 0, 0);
      const dailyForecasts = forecastResult.list
        .filter(forecast => {
          const forecastDate = new Date(forecast.dt * 1000).setHours(0, 0, 0, 0);
          return forecastDate > today;
        })
        .filter((forecast, index) => index % 8 === 0)
        .slice(0, 5);
      
      setWeatherData(weatherResult);
      setForecastData(dailyForecasts);
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchWeatherData(city);
  };

  return (
    <div className={`weather-container ${weatherData ? getWeatherBackground(weatherData.weather[0].id) : ''}`}>
      <form onSubmit={handleFormSubmit} className="search-form">
        <input
          type="text"
          value={city}
          onChange={handleCityChange}
          placeholder="Enter city name (e.g., London)"
          className="city-input"
          required
          minLength={2}
        />
        <button 
          type="submit" 
          className="search-button"
          disabled={!city.trim() || loading}
        >
          {loading ? 'Loading...' : 'Get Weather'}
        </button>
      </form>

      {error && (
        <div className="error-container">
          <p>Error: {error}</p>
          <p>Please check if:</p>
          <ul>
            <li>The city name is spelled correctly</li>
            <li>You have entered a valid city name</li>
            <li>You have a stable internet connection</li>
          </ul>
        </div>
      )}
      
      {loading && (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading weather data...</p>
        </div>
      )}
      
      {weatherData && !loading && !error && (
        <>
          <h1 className="city-title">Weather in {weatherData.name}</h1>
          
          {/* Current Weather */}
          <div className="current-weather">
            <h2>Current Weather</h2>
            <WeatherCard weather={weatherData} isCurrent={true} />
          </div>

          {/* 5-Day Forecast */}
          {forecastData && forecastData.length > 0 && (
            <div className="forecast-section">
              <h2>Next {forecastData.length} Days Forecast</h2>
              <div className="forecast-grid">
                {forecastData.map((forecast, index) => (
                  <WeatherCard key={index} weather={forecast} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherComponent;
