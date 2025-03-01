import React from 'react';
import WeatherComponent from './components/WeatherComponent';
import './styles/App.css';

function App() {
    return (
        <div className="App">
            <h1>Weather Application</h1>
            <WeatherComponent />
        </div>
    );
}

export default App;