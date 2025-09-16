import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Dashboard from './components/Dashboard';
import RoutePlanning from './components/RoutePlanning';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [currentView, setCurrentView] = useState('route'); // 'route', 'map', 'dashboard'

  return (
    <div className="App">
      {/* Navigation Header */}
      <nav style={{ 
        background: '#2c3e50', 
        padding: '15px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>SafePath AI</h1>
        <div>
          <button 
            onClick={() => setCurrentView('route')}
            style={{ 
              background: currentView === 'route' ? '#3498db' : '#34495e', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              marginRight: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🗺️ Route Planning
          </button>
          <button 
            onClick={() => setCurrentView('map')}
            style={{ 
              background: currentView === 'map' ? '#3498db' : '#34495e', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              marginRight: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🗺️ Map View
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            style={{ 
              background: currentView === 'dashboard' ? '#3498db' : '#34495e', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📊 Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'route' && <RoutePlanning />}
      
      {currentView === 'dashboard' && <Dashboard />}
      
      {currentView === 'map' && (
        <div style={{ height: "calc(100vh - 70px)", width: "100%" }}>
          <MapContainer center={[12.9250, 80.2250]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[12.9250, 80.2250]}>
              <Popup>SafePath Demo Marker</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default App;
