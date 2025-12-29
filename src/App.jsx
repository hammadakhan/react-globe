import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Globe from "react-globe.gl";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import axios from "axios";
import "./App.css";

// Replace or expand this with more country coordinates as needed
// const countryCoordinates = {
//   US: { lat: 37.0902, lng: -95.7129 },
//   IN: { lat: 20.5937, lng: 78.9629 },
//   RU: { lat: 61.524, lng: 105.3188 },
//   CN: { lat: 35.8617, lng: 104.1954 },
//   GB: { lat: 55.3781, lng: -3.4360 },
//   DE: { lat: 51.1657, lng: 10.4515 },
//   // Add more countries as needed
// };

function App() {
  const globeEl = useRef();
  const [attackData, setAttackData] = useState({});
  const [arcData, setArcData] = useState([]);
  const [showLabels, setShowLabels] = useState(true);
  const [countryCoordinates, setCountryCoordinates] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [topCountries, setTopCountries] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse panel on mobile by default
  useEffect(() => {
    if (dimensions.isMobile) {
      setIsPanelCollapsed(true);
    }
  }, [dimensions.isMobile]);

  // Fetch coordinates
  useEffect(() => {
    axios
      .get(`${import.meta.env.BASE_URL}lat_long.json`)
      .then((res) => {
        const coords = res.data.reduce((acc, item) => {
          acc[item["Alpha-2 code"]] = {
            lat: item["Latitude (average)"],
            lng: item["Longitude (average)"],
            name: item["Country"]
          };
          return acc;
        }, {});
        setCountryCoordinates(coords);
      })
      .catch((err) => console.error("Error loading coordinates:", err));
  }, []);

  // Fetch attack data from API
  useEffect(() => {
    axios
      .get("http://172.190.180.89:85/dashboard-scheduler/blacklist-ips")
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.ips) {
          const ips = res.data.data.ips;
          
          // Count attacks by country code
          const countryCounts = ips.reduce((acc, item) => {
            if (item.countryCode) {
              acc[item.countryCode] = (acc[item.countryCode] || 0) + 1;
            }
            return acc;
          }, {});
          
          setAttackData(countryCounts);
          setTotalAttacks(ips.length);
          
          // Get top 5 countries
          const top5 = Object.entries(countryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          setTopCountries(top5);
        }
      })
      .catch((err) => console.error("Error loading blacklist IPs data:", err));
  }, []);

  // Build arcs once both attackData and coordinates are ready
  useEffect(() => {
    if (!Object.keys(attackData).length || !Object.keys(countryCoordinates).length) return;

    const arcs = Object.entries(attackData)
      .map(([iso, count]) => {
        const coords = countryCoordinates[iso];
        if (!coords) return null;
        return {
          country: iso,
          countryName: coords.name || iso,
          count,
          startLat: coords.lat,
          startLng: coords.lng,
          endLat: coords.lat,
          endLng: coords.lng
        };
      })
      .filter(Boolean);

    setArcData(arcs);
  }, [attackData, countryCoordinates]);

  // Initialize and update globe settings
  useEffect(() => {
    if (globeEl.current) {
      // Adjust globe size based on screen dimensions
      globeEl.current.controls().autoRotate = !selectedCountry;
      globeEl.current.controls().autoRotateSpeed = 0.2;
      
      // Adjust globe properties for mobile
      if (dimensions.isMobile) {
        globeEl.current.controls().enableZoom = true;
        globeEl.current.controls().zoomSpeed = 0.8;
        globeEl.current.pointOfView({ altitude: dimensions.isMobile ? 2.5 : 2.0 });
      }
    }
  }, [selectedCountry, dimensions.isMobile]);

  const colorScale = scaleSequentialSqrt(interpolateYlOrRd);
  const maxVal = useMemo(() => Math.max(...Object.values(attackData), 1), [attackData]);
  colorScale.domain([0, maxVal]);

  const labels = useMemo(() => {
    // Reduce number of labels on mobile
    const entries = Object.entries(attackData);
    const filteredEntries = dimensions.isMobile 
      ? entries
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10) 
      : entries;
    
    return filteredEntries.map(([iso, count]) => {
      const coords = countryCoordinates[iso];
      return coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
            text: `${iso}: ${count}`
          }
        : null;
    }).filter(Boolean);
  }, [attackData, countryCoordinates, dimensions.isMobile]);
  
  // Handle arc click
  const handleArcClick = arc => {
    // If already selected, deselect; otherwise, select the clicked country
    setSelectedCountry(selectedCountry && selectedCountry.country === arc.country ? null : arc);
    
    // If selecting a country, focus the globe on it
    if (!selectedCountry || selectedCountry.country !== arc.country) {
      // Expand panel when selecting a country
      setIsPanelCollapsed(false);
      
      globeEl.current.pointOfView(
        {
          lat: arc.startLat,
          lng: arc.startLng,
          altitude: dimensions.isMobile ? 2.2 : 1.8
        }, 
        1000 // transition duration
      );
    }
  };
  
  // Define intensity levels for legend and classification
  const intensityLevels = [
    { label: "Low", threshold: 0, color: "yellow" },
    { label: "Medium", threshold: 20, color: "orange" },
    { label: "High", threshold: 50, color: "red" }
  ];
  
  // Get severity level for a count
  const getSeverityLevel = count => {
    for (let i = intensityLevels.length - 1; i >= 0; i--) {
      if (count >= intensityLevels[i].threshold) {
        return intensityLevels[i];
      }
    }
    return intensityLevels[0];
  };
  
  // Get arc color based on count
  const getArcColor = count => {
    const level = getSeverityLevel(count);
    return level.color;
  };

  // Toggle info panel for mobile
  const toggleInfoPanel = () => {
    if (dimensions.isMobile && selectedCountry) {
      setSelectedCountry(null);
    }
  };

  // Toggle panel collapse state
  const togglePanelCollapse = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  return (
    <div className="globe-container">
      <div className="controls">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="control-button"
        >
          {showLabels ? "Hide" : "Show"} Labels
        </button>
        
        {selectedCountry && (
          <button 
            onClick={() => setSelectedCountry(null)}
            className="control-button"
          >
            Close Details
          </button>
        )}
        
        <button
          onClick={togglePanelCollapse}
          className="control-button panel-toggle"
        >
          {isPanelCollapsed ? "Show Panel" : "Hide Panel"}
        </button>
      </div>

      {/* Mobile expand button */}
     {isPanelCollapsed && <button 
        className="mobile-expand-btn"
        onClick={togglePanelCollapse}
        aria-label={isPanelCollapsed ? "Show info panel" : "Hide info panel"}
      >
        {isPanelCollapsed ? "📊" : "✖"}
      </button>}

      <div className={`info-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
        {!isPanelCollapsed && (
          <>
            <div className="panel-header">
              <h2>
                {selectedCountry 
                  ? selectedCountry.countryName || selectedCountry.country 
                  : "Blacklist IP Visualization"
                }
              </h2>
              <button className="collapse-btn" onClick={togglePanelCollapse}>
                ✖
              </button>
            </div>
            
            {selectedCountry ? (
              <div className="country-details">
                <div className="stat">
                  <span className="stat-label">Country Code:</span>
                  <span className="stat-value">{selectedCountry.country}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Blacklisted IPs:</span>
                  <span className="stat-value">{selectedCountry.count}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Severity:</span>
                  <span className={`severity-badge ${getSeverityLevel(selectedCountry.count).color}`}>
                    {getSeverityLevel(selectedCountry.count).label}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Global Share:</span>
                  <span className="stat-value">
                    {((selectedCountry.count / totalAttacks) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="stat">
                  <span className="stat-label">Total Blacklisted IPs:</span>
                  <span className="stat-value">{totalAttacks}</span>
                </div>
                <div className="top-countries">
                  <h3>Most Targeted Countries</h3>
                  <ul className="country-list">
                    {topCountries.map(([code, count]) => {
                      const severity = getSeverityLevel(count);
                      return (
                        <li 
                          key={code} 
                          className="country-item"
                          onClick={() => {
                            const arcInfo = arcData.find(a => a.country === code);
                            if (arcInfo) handleArcClick(arcInfo);
                          }}
                        >
                          <span className="country-code">{code}</span>
                          <span className="country-attacks">{count} IPs</span>
                          <span className={`severity-indicator ${severity.color}`}></span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="legend">
                  <h3>Threat Intensity</h3>
                  {intensityLevels.map(level => (
                    <div key={level.label} className="legend-item">
                      <span className={`legend-marker ${level.color}`}></span>
                      <span className="legend-label">
                        {level.label} {level.threshold > 0 ? `(${level.threshold}+)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="instructions">
                  Click on arcs or country names to see detailed information.
                </div>
              </>
            )}
          </>
        )}
        
        {isPanelCollapsed && (
          <div className="panel-tab" onClick={togglePanelCollapse}>
            <span>{dimensions.isMobile ? "📊 View Stats" : "Show Info"}</span>
          </div>
        )}
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereAltitude={0.25}
        atmosphereColor="lightskyblue"
        arcsData={arcData}
        arcStartLat={(d) => d.startLat}
        arcStartLng={(d) => d.startLng}
        arcEndLat={(d) => d.endLat}
        arcEndLng={(d) => d.endLng}
        arcColor={(d) => {
          const color = getArcColor(d.count);
          const isSelected = selectedCountry && selectedCountry.country === d.country;
          return isSelected ? 'white' : color;
        }}
        arcAltitude={(d) => {
          const isSelected = selectedCountry && selectedCountry.country === d.country;
          return isSelected ? d.count * 0.002 : d.count * 0.001;
        }}
        arcDashLength={0.3}
        arcDashGap={0.02}
        arcDashAnimateTime={0} // Disable animation for better performance
        arcStroke={(d) => {
          const isSelected = selectedCountry && selectedCountry.country === d.country;
          return isSelected ? 0.8 : 0.4;
        }}
        arcLabel={(d) => `<b>${d.countryName || d.country}</b><br />Blacklisted IPs: <i>${d.count}</i>`}
        onArcClick={handleArcClick}
        onGlobeClick={dimensions.isMobile ? toggleInfoPanel : undefined}
        labelsData={showLabels ? labels : []}
        labelLat={(d) => d.lat}
        labelLng={(d) => d.lng}
        labelText={(d) => d.text}
        labelSize={dimensions.isMobile ? 0.8 : 1.2}
        labelDotRadius={dimensions.isMobile ? 0.2 : 0.25}
        labelColor={() => "white"}
        labelResolution={2}
        width={dimensions.width}
        height={dimensions.height}
        rendererConfig={{ antialias: !dimensions.isMobile }}
      />
    </div>
  );
}

export default App;
