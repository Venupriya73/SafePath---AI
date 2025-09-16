import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./RoutePlanning.css";

// Fix leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

// --- Location and hazard helpers ---
async function loadHazards() {
  const response = await fetch("/hazards.json");
  if (!response.ok) throw new Error("Failed to load hazards data");
  return await response.json();
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkHazardsNearRoute(routeCoords, hazards) {
  const result = [];
  hazards.forEach((hazard) => {
    for (const [lat, lon] of routeCoords) {
      if (getDistanceMeters(lat, lon, hazard.lat, hazard.lon) <= hazard.radius_meters) {
        result.push(hazard);
        break;
      }
    }
  });
  return result;
}

async function getCoordinates(place) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}&limit=1`
  );
  const data = await response.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  throw new Error("Location not found: " + place);
}

// Modified getRoute to fetch steps
async function getRoute(startCoords, endCoords) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson&steps=true`
  );
  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const steps = route.legs.flatMap(leg => leg.steps.map(step => step.maneuver.instruction));
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance / 1000, // km
      duration: route.duration / 60, // minutes
      steps,
    };
  }
  throw new Error("Route calculation failed");
}

// --- Voice Chatbot component ---
function VoiceChatbot({ onCommand }) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript.trim()) {
      onCommand(transcript.trim());
      resetTranscript();
    }
  }, [listening, transcript, onCommand, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.</span>;
  }

  return (
    <div style={{ background: "#fff6", borderRadius: 8, padding: 12, marginBottom: 20 }}>
      <button
        onClick={() => SpeechRecognition.startListening({ continuous: false, language: "en-IN" })}
        disabled={listening}
        style={{
          fontWeight: 700,
          fontSize: 16,
          padding: "8px 16px",
          borderRadius: 6,
          background: "#3f72af",
          color: "#fff",
          cursor: listening ? "default" : "pointer"
        }}
      >
        🎤 {listening ? "Listening..." : "Start Voice"}
      </button>
      <span style={{ marginLeft: 12, fontStyle: "italic" }}>
        {listening ? "Speak your command..." : transcript ? `Heard: "${transcript}"` : ""}
      </span>
    </div>
  );
}

// --- Main RoutePlanning component ---
export default function RoutePlanning() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routeFound, setRouteFound] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);

  // Save recent routes to localStorage to persist on refresh
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentRoutes"));
    if (stored && Array.isArray(stored)) {
      setRecentRoutes(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("recentRoutes", JSON.stringify(recentRoutes));
  }, [recentRoutes]);

  // Text-to-speech function
  function speak(message) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(message);
      utter.lang = "en-IN";
      window.speechSynthesis.speak(utter);
    }
  }

  async function handleVoiceCommand(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("safe route from")) {
      const parts = lowerText.match(/safe route from (.+) to (.+)/);
      if (parts && parts.length === 3) {
        const from = parts[1].trim();
        const to = parts[2].trim();
        setFromLocation(from);
        setToLocation(to);
        speak(`Finding the safest route from ${from} to ${to}`);
        await handleFindRoute(from, to);
        return;
      }
    } else if (lowerText.includes("start navigation")) {
      speak("Starting navigation in Google Maps");
      handleStartNavigation();
      return;
    }
    speak("Sorry, I did not understand that. Please try again.");
  }

  async function handleFindRoute(inputFrom, inputTo) {
    const from = inputFrom || fromLocation;
    const to = inputTo || toLocation;

    if (!from || !to) {
      alert("Please enter both source and destination.");
      return;
    }
    setLoading(true);
    setRouteCoords(null);
    setRouteInfo(null);
    setHazards([]);
    setRouteFound(false);
    setRouteSteps([]);

    try {
      const fromCoords = await getCoordinates(from.trim());
      const toCoords = await getCoordinates(to.trim());
      const route = await getRoute(fromCoords, toCoords);

      setRouteCoords(route.coordinates);
      setRouteInfo(route);
      setRouteSteps(route.steps || []);

      const hazardsData = await loadHazards();
      const hazardsOnRoute = checkHazardsNearRoute(route.coordinates, hazardsData);
      setHazards(hazardsOnRoute);
      setFromLocation(from);
      setToLocation(to);

      setRouteFound(true);

      // Save to recent routes for quick access
      const routePair = { from, to };
      setRecentRoutes((prev) => [routePair, ...prev.filter(r => r.from !== from || r.to !== to)].slice(0, 5));

      if (hazardsOnRoute.length === 0) {
        speak("No major hazards detected. Safe route.");
      } else {
        const messages = hazardsOnRoute.map(hz => `${hz.description} at ${hz.name}`);
        speak("Attention: " + messages.join(". "));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  function handleStartNavigation() {
    if (routeCoords && routeCoords.length >= 2) {
      const start = routeCoords[0];
      const end = routeCoords[routeCoords.length - 1];
      const url = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}`;
      window.open(url, "_blank");
    }
  }

  function handleSubmitFeedback() {
    if (feedback.trim()) {
      alert("Thank you for your feedback!");
      setFeedback("");
    } else {
      alert("Please enter your feedback before submitting.");
    }
  }

  function fillRecentRoute(from, to) {
    setFromLocation(from);
    setToLocation(to);
    setRouteFound(false);
  }

  return (
    <div className="route-planning-container">
      <div className="planning-panel">
        <h1>SafePath AI</h1>

        <VoiceChatbot onCommand={handleVoiceCommand} />

        <div className="route-form">
          <h2>🗺️ Route Planning</h2>
          <div className="input-group">
            <label>From</label>
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="Enter starting location"
              className="location-input"
            />
          </div>
          <div className="input-group">
            <label>To</label>
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="Enter destination"
              className="location-input"
            />
          </div>
          <button onClick={() => handleFindRoute()} disabled={loading} className="find-route-btn">
            {loading ? "Finding Safe Route..." : "Find Safe Route"}
          </button>

          {routeFound && routeInfo && (
            <>
              <div className="route-info">
                <h3>✅ Safe Route Found</h3>
                <div className="stats">
                  <div>
                    <strong>Distance:</strong> {routeInfo.distance.toFixed(2)} km
                  </div>
                  <div>
                    <strong>Estimated Time:</strong> {Math.floor(routeInfo.duration / 60)}h {Math.round(routeInfo.duration % 60)}m
                  </div>
                </div>
              </div>

              <div className="route-warnings">
                <h4>⚠️ Safety Alerts</h4>
                {hazards.length === 0 && <div className="alert success">✅ No major hazards detected. Safe route.</div>}
                {hazards.map((hazard) => (
                  <div key={hazard.id} className={`alert ${hazard.type}`} title={hazard.description}>
                    <span>{hazard.icon || "⚠️"}</span> {hazard.description} ({hazard.name})
                  </div>
                ))}
              </div>

              <button className="start-navigation-btn" onClick={handleStartNavigation}>
                🚗 Start Navigation
              </button>
            </>
          )}

          {/* Quick Emergency Contacts */}
          <div style={{ marginTop: 24 }}>
            <h3>🆘 Quick Emergency Contacts</h3>
            <ul>
              <li>Police: 100</li>
              <li>Ambulance: 102</li>
              <li>Nearest Hospital: Contact Local Center</li>
            </ul>
          </div>

          {/* Recent Searches */}
          <div style={{ marginTop: 24 }}>
            <h3>🕒 Recent Routes</h3>
            {recentRoutes.length === 0 && <p>No recent routes found.</p>}
            <ul className="recent-routes-list">
              {recentRoutes.map(({ from, to }, i) => (
                <li key={i}>
                  <button className="recent-route-btn" onClick={() => fillRecentRoute(from, to)}>
                    {from} → {to}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback Box */}
          <div style={{ marginTop: 24 }}>
            <h3>💬 Feedback</h3>
            <textarea
              style={{ width: "100%", minHeight: "80px", borderRadius: 6, padding: 8 }}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your feedback…"
            />
            <button onClick={handleSubmitFeedback} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6 }}>
              Submit Feedback
            </button>
          </div>
        </div>
      </div>

      <div className="map-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <MapContainer
          center={routeCoords ? routeCoords[0] : [13.0827, 80.2707]}
          zoom={7}
          style={{ height: "65vh", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {routeCoords && (
            <>
              <Marker position={routeCoords[0]}>
                <Popup>Start: {fromLocation}</Popup>
              </Marker>
              <Marker position={routeCoords[routeCoords.length - 1]}>
                <Popup>End: {toLocation}</Popup>
              </Marker>
              <Polyline positions={routeCoords} color="green" />
            </>
          )}
        </MapContainer>

        {/* Enhanced Right Panel - Dynamic Info Cards */}
        <div className="map-panel-info-cards" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {/* Weather Widget */}
          <div className="info-card weather-card" style={cardStyle}>
            <h4>Weather at Destination</h4>
            <div>
              Location: <b>{toLocation || "Destination"}</b>
            </div>
            <div>🌡️ 32°C, Clear (Sample)</div>
            <div>💧 Rain: 10%</div>
            <div>🌬️ Wind: 6 km/h</div>
          </div>

          {/* Traffic Widget */}
          <div className="info-card traffic-card" style={cardStyle}>
            <h4>Live Traffic</h4>
            <div>🟢 Smooth traffic</div>
            <div>
              Congestion: <span style={{ color: "orange", fontWeight: 700 }}>Medium</span>
            </div>
          </div>

          {/* Safe Places Widget */}
          <div className="info-card safeplaces-card" style={cardStyle}>
            <h4>Nearby Safe Places</h4>
            <ul>
              <li>🏥 Apollo Hospital (2.1 km)</li>
              <li>🚓 Police Station (1.4 km)</li>
              <li>⛽ Petrol Pump (0.9 km)</li>
            </ul>
          </div>

          {/* Route Steps */}
          <div className="info-card steps-card" style={cardStyle}>
            <h4>Route Steps</h4>
            {routeSteps.length > 0 ? (
              <ol>
                {routeSteps.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            ) : (
              <p>Enter locations and find route to see steps.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#f6f9ff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px #e4e9fa50",
  padding: "18px 20px",
  minWidth: "220px",
  flex: "1 1 220px",
  color: "#333"
};
