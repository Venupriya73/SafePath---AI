import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [engineStats, setEngineStats] = useState({
    processingSpeed: 91.5,
    accuracy: 75.2,
    dataPoints: 44715,
    optimization: 100.0,
    learningRate: 77.2,
    confidenceLevel: 95.7
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h2>SafePath AI - Route Engine Dashboard</h2>
        <button className="manual-scan-btn">🔍 Run Manual Scan</button>
      </div>

      <div className="dashboard-content">
        {/* Left Panel - AI Engine Status */}
        <div className="left-panel">
          <div className="engine-status">
            <h3>🟢 AI Route Engine Status</h3>
            <div className="status-badge">✓ Complete</div>
            
            <div className="metric-item">
              <label>🚀 Processing Speed</label>
              <div className="metric-value green">{engineStats.processingSpeed}%</div>
              <div className="progress-bar">
                <div className="progress-fill green" style={{width: `${engineStats.processingSpeed}%`}}></div>
              </div>
            </div>

            <div className="metric-item">
              <label>🎯 Accuracy</label>
              <div className="metric-value orange">{engineStats.accuracy}%</div>
              <div className="progress-bar">
                <div className="progress-fill orange" style={{width: `${engineStats.accuracy}%`}}></div>
              </div>
            </div>

            <div className="metric-item">
              <label>📊 Data Points</label>
              <div className="metric-value blue">{engineStats.dataPoints.toLocaleString()}</div>
            </div>

            <div className="metric-item">
              <label>⚡ Optimization</label>
              <div className="metric-value green">{engineStats.optimization}%</div>
              <div className="progress-bar">
                <div className="progress-fill green" style={{width: `${engineStats.optimization}%`}}></div>
              </div>
            </div>

            <div className="ml-performance">
              <h4>🤖 Machine Learning Performance</h4>
              <div className="ml-metric">
                <span>Learning Rate: {engineStats.learningRate}%</span>
                <div className="progress-bar small">
                  <div className="progress-fill blue" style={{width: `${engineStats.learningRate}%`}}></div>
                </div>
              </div>
              <div className="ml-metric">
                <span>Confidence Level: {engineStats.confidenceLevel}%</span>
                <div className="progress-bar small">
                  <div className="progress-fill green" style={{width: `${engineStats.confidenceLevel}%`}}></div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="action-btn primary">🔄 Run Deep Learning Cycle</button>
              <button className="action-btn secondary">📈 Update Training Data</button>
              <button className="action-btn tertiary">⚡ Optimize Algorithms</button>
            </div>
          </div>
        </div>

        {/* Right Panel - Safety Recommendations */}
        <div className="right-panel">
          <div className="safety-recommendations">
            <h3>🛡️ Safety Recommendations</h3>
            
            <div className="speed-indicator">
              <div className="current-speed">21 km/h</div>
              <div className="speed-percentage">40%</div>
            </div>

            <div className="route-alerts">
              <div className="alert danger">
                <span className="alert-dot red">●</span>
                <div className="alert-content">
                  <div className="alert-title">Main St & 5th Ave</div>
                  <div className="alert-time">⏱ 38s remaining</div>
                </div>
              </div>

              <div className="alert success">
                <span className="alert-dot green">●</span>
                <div className="alert-content">
                  <div className="alert-title">AI Prediction</div>
                  <div className="alert-subtitle">Next: Green in 45s</div>
                </div>
              </div>
            </div>

            <div className="distance-info">
              <div className="info-item">
                <span className="label">Distance:</span>
                <span className="value">200m</span>
              </div>
              <div className="info-item">
                <span className="label">Average:</span>
                <span className="value">12s</span>
              </div>
            </div>

            <div className="mini-map">
              <div className="map-placeholder">
                <div className="route-line"></div>
                <div className="danger-point"></div>
                <div className="current-location"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
