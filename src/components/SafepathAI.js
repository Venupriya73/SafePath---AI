import React, { useState, useEffect } from "react";

// Hazard data array
const hazardsData = [
  {
    id: 1,
    type: "construction",
    name: "NH-48 Road Work",
    lat: 12.966,
    lon: 79.797,
    radius_meters: 6000,
    description: "Major road construction: Expect 20 min delay.",
    active_hours: "07:00-21:00",
    icon: "🚧"
  },
  {
    id: 2,
    type: "accident",
    name: "Chengalpattu Bypass Accident",
    lat: 12.665,
    lon: 79.971,
    radius_meters: 6000,
    description: "Recent accident reported. Proceed with caution.",
    active_hours: "All day",
    icon: "💥"
  },
  {
    id: 3,
    type: "railway_crossing",
    name: "Near Paranur Railway",
    lat: 12.665,
    lon: 79.9684,
    radius_meters: 6000,
    description: "Railway crossing. Trains pass: 9:10AM, 12:35PM, 6:40PM.",
    active_hours: "All day",
    icon: "🚂"
  },
  {
    id: 4,
    type: "weather",
    name: "Kanchipuram Flood Zone",
    lat: 12.8342,
    lon: 79.7043,
    radius_meters: 8000,
    description: "Flood-prone area. Avoid during heavy rain.",
    active_hours: "Monsoon",
    icon: "🌧️"
  },
  {
    id: 5,
    type: "crowded_area",
    name: "Kanchipuram Market",
    lat: 12.837,
    lon: 79.701,
    radius_meters: 4000,
    description: "High pedestrian traffic area",
    active_hours: "10:00-22:00",
    icon: "👥"
  }
];

// Helper: Distance calculation (Haversine formula)
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Check if hazard is active now
function isHazardActive(hazard, currentTime, currentDate) {
  if (hazard.active_hours === "All day") return true;
  if (hazard.active_hours === "Monsoon") {
    return currentDate.getMonth() >= 5 && currentDate.getMonth() <= 9;
  }
  if (hazard.active_hours) {
    const [start, end] = hazard.active_hours.split("-").map(t => t.trim());
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }
  return false;
}

// Filter hazards by distance and active time
function filterHazards(hazards, lat, lon, currentTime, currentDate) {
  return hazards.filter(hazard => {
    const inRadius = getDistanceFromLatLonInMeters(hazard.lat, hazard.lon, lat, lon) <= hazard.radius_meters;
    const active = isHazardActive(hazard, currentTime, currentDate);
    return inRadius && active;
  });
}

// Simple mock geocode function (place name to coordinates)
const geocode = (placeName) => {
  const places = {
    chennai: { lat: 13.0827, lon: 80.2707 },
    kanchipuram: { lat: 12.8342, lon: 79.7043 },
    bengaluru: { lat: 12.9716, lon: 77.5946 },
    mysuru: { lat: 12.2958, lon: 76.6394 }
  };
  return places[placeName.toLowerCase()] || null;
};

// Mock fetch functions for other info
const fetchWeatherForLocation = (location) => ({
  location,
  temperature: "32°C",
  condition: "Clear (Sample)",
  rain: "10%",
  wind: "6 km/h"
});
const fetchLiveTraffic = () => ({ status: "Smooth traffic", congestion: "Medium" });
const fetchNearbySafePlaces = () => [
  { name: "Apollo Hospital", distance: "2.1 km", icon: "🏥" },
  { name: "Police Station", distance: "1.4 km", icon: "🚓" },
  { name: "Petrol Pump", distance: "0.9 km", icon: "⛽" }
];
const fetchRouteSteps = () => [
  "Head north on ABC street",
  "Turn right at XYZ junction",
  "Continue straight for 5 km",
  "Take the exit toward Kanchipuram"
];

// The main component
export default function SafePathAI() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const [nearbyHazards, setNearbyHazards] = useState([]);
  const [weather, setWeather] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [safePlaces, setSafePlaces] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);

  // On "From" or "To" change, geocode locations
  useEffect(() => {
    if (!from || !to) return;
    const fromCoords = geocode(from);
    const toCoords = geocode(to);
    if (!fromCoords || !toCoords) {
      console.warn("Invalid From or To location");
      return;
    }
    setUserLocation(fromCoords);
    setDestination(toCoords);
  }, [from, to]);

  // When locations update, update hazards, weather, traffic, places, route steps
  useEffect(() => {
    if (!userLocation || !destination) return;

    const now = new Date();
    setNearbyHazards(filterHazards(hazardsData, userLocation.lat, userLocation.lon, now, now));
    setWeather(fetchWeatherForLocation(to));
    setTraffic(fetchLiveTraffic());
    setSafePlaces(fetchNearbySafePlaces());
    setRouteSteps(fetchRouteSteps());
  }, [userLocation, destination, to]);

  return (
    <div style={{ padding: 20 }}>
      <h1>SafePath AI</h1>
      <div>
        <label>
          From:{" "}
          <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Enter start location" />
        </label>
      </div>
      <div>
        <label>
          To:{" "}
          <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Enter destination" />
        </label>
      </div>
      <hr />

      <h3>Nearby Hazards</h3>
      <ul>
        {nearbyHazards.length === 0 ? (
          <li>No hazards nearby.</li>
        ) : (
          nearbyHazards.map((hazard) => (
            <li key={hazard.id}>
              <span>{hazard.icon}</span> <strong>{hazard.name}</strong>: {hazard.description}
            </li>
          ))
        )}
      </ul>

      <h3>Weather at Destination ({to || "-"})</h3>
      {weather ? (
        <ul>
          <li>Temperature: {weather.temperature}</li>
          <li>Condition: {weather.condition}</li>
          <li>Rain: {weather.rain}</li>
          <li>Wind: {weather.wind}</li>
        </ul>
      ) : (
        <p>Enter destination to see weather.</p>
      )}

      <h3>Live Traffic</h3>
      {traffic ? (
        <p>
          {traffic.status} | Congestion: <strong>{traffic.congestion}</strong>
        </p>
      ) : (
        <p>Loading traffic...</p>
      )}

      <h3>Nearby Safe Places</h3>
      <ul>
        {safePlaces.map((place, idx) => (
          <li key={idx}>
            {place.icon} {place.name} ({place.distance})
          </li>
        ))}
      </ul>

      <h3>Route Steps</h3>
      <ol>
        {routeSteps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
