import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { interpolateRdYlGn, interpolateYlOrRd, interpolateInferno } from "d3-scale-chromatic";
import "./Heatmap.css";
import { Link } from "react-router-dom";

// GeoJSON URL for world map
const geoUrl = "/react-globe/ne_110m_admin_0_countries.geojson";

// Static data for heatmap - you can replace this with API data later
// Using ISO 3166-1 alpha-3 codes which match the GeoJSON
const staticHeatmapData = {
  USA: { attacks: 1245, sector: "Healthcare", avgSeverity: 8.5 },
  GBR: { attacks: 892, sector: "Finance", avgSeverity: 7.8 },
  DEU: { attacks: 756, sector: "Manufacturing", avgSeverity: 7.2 },
  IND: { attacks: 634, sector: "Technology", avgSeverity: 6.9 },
  CHN: { attacks: 589, sector: "Finance", avgSeverity: 6.5 },
  FRA: { attacks: 523, sector: "Healthcare", avgSeverity: 6.8 },
  CAN: { attacks: 487, sector: "Energy", avgSeverity: 6.3 },
  AUS: { attacks: 456, sector: "Education", avgSeverity: 6.1 },
  BRA: { attacks: 423, sector: "Finance", avgSeverity: 5.9 },
  JPN: { attacks: 398, sector: "Technology", avgSeverity: 5.7 },
  ITA: { attacks: 367, sector: "Healthcare", avgSeverity: 5.5 },
  ESP: { attacks: 345, sector: "Tourism", avgSeverity: 5.3 },
  RUS: { attacks: 312, sector: "Energy", avgSeverity: 5.1 },
  KOR: { attacks: 289, sector: "Technology", avgSeverity: 4.9 },
  NLD: { attacks: 267, sector: "Finance", avgSeverity: 4.7 },
  MEX: { attacks: 245, sector: "Manufacturing", avgSeverity: 4.5 },
  CHE: { attacks: 223, sector: "Finance", avgSeverity: 4.3 },
  SWE: { attacks: 201, sector: "Technology", avgSeverity: 4.1 },
  BEL: { attacks: 189, sector: "Healthcare", avgSeverity: 3.9 },
  POL: { attacks: 167, sector: "Manufacturing", avgSeverity: 3.7 },
  SGP: { attacks: 145, sector: "Finance", avgSeverity: 3.5 },
  NOR: { attacks: 134, sector: "Energy", avgSeverity: 3.3 },
  AUT: { attacks: 123, sector: "Tourism", avgSeverity: 3.1 },
  DNK: { attacks: 112, sector: "Technology", avgSeverity: 2.9 },
  FIN: { attacks: 101, sector: "Education", avgSeverity: 2.7 },
  TUR: { attacks: 95, sector: "Finance", avgSeverity: 2.5 },
  SAU: { attacks: 87, sector: "Energy", avgSeverity: 2.3 },
  ZAF: { attacks: 78, sector: "Mining", avgSeverity: 2.1 },
  ARG: { attacks: 69, sector: "Agriculture", avgSeverity: 1.9 },
  PRT: { attacks: 56, sector: "Tourism", avgSeverity: 1.7 },
};

function Heatmap() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const colorScheme = "ylorrd"; // Fixed to yellow-orange-red theme
  const [tooltipContent, setTooltipContent] = useState("");
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

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

  // Color scale for heatmap
  const maxAttacks = useMemo(() => 
    Math.max(...Object.values(staticHeatmapData).map(d => d.attacks)), 
    []
  );

  const colorScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxAttacks])
      .range([0, 1]);
  }, [maxAttacks]);

  const getColor = (attacks) => {
    if (!attacks) return "#1a1a2e"; // Default dark color for countries with no data
    
    const t = colorScale(attacks);
    return interpolateYlOrRd(t);
  };

  const getSeverityColor = (severity) => {
    if (severity >= 7) return "#f44336"; // Red
    if (severity >= 5) return "#ff9800"; // Orange
    return "#4caf50"; // Green
  };

  const getSeverityLabel = (severity) => {
    if (severity >= 7) return "Critical";
    if (severity >= 5) return "High";
    return "Medium";
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const countries = Object.values(staticHeatmapData);
    const totalAttacks = countries.reduce((sum, d) => sum + d.attacks, 0);
    const avgSeverity = countries.reduce((sum, d) => sum + d.avgSeverity, 0) / countries.length;
    const criticalCount = countries.filter(d => d.avgSeverity >= 7).length;
    
    return {
      totalAttacks,
      avgSeverity: avgSeverity.toFixed(1),
      criticalCount,
      affectedCountries: countries.length
    };
  }, []);

  return (
    <div className="heatmap-container">
      <div className="map-wrapper">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: dimensions.isMobile ? 100 : 147,
            center: [0, 20]
          }}
          width={800}
          height={400}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryCode = geo.properties.ISO_A3;
                  const countryData = staticHeatmapData[countryCode];
                  const countryName = geo.properties.NAME;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(countryData?.attacks)}
                      stroke="#0a0a0a"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none"
                        },
                        hover: {
                          fill: "#00d4ff",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#00ff88",
                          outline: "none"
                        }
                      }}
                      onMouseEnter={() => {
                        if (countryData) {
                          setTooltipContent(`${countryName}: ${countryData.attacks} attacks`);
                        } else {
                          setTooltipContent(`${countryName}: No data`);
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      onClick={() => {
                        if (countryData) {
                          setSelectedCountry({
                            name: countryName,
                            code: countryCode,
                            ...countryData
                          });
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div className="map-tooltip">
            {tooltipContent}
          </div>
        )}
      </div>

      {/* Selected Country Details Panel */}
      {/* {selectedCountry && (
        <div className="detail-panel">
          <div className="detail-header">
            <h2>{selectedCountry.name} ({selectedCountry.code})</h2>
            <button 
              className="close-detail-btn"
              onClick={() => setSelectedCountry(null)}
            >
              ✖
            </button>
          </div>
          <div className="detail-content">
            <div className="detail-stat">
              <span className="detail-label">Total Attacks:</span>
              <span className="detail-value">{selectedCountry.attacks.toLocaleString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-label">Primary Sector:</span>
              <span className="detail-value">{selectedCountry.sector}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-label">Average Severity:</span>
              <span 
                className="detail-value"
                style={{ color: getSeverityColor(selectedCountry.avgSeverity) }}
              >
                {selectedCountry.avgSeverity} / 10
              </span>
            </div>
            <div className="detail-stat">
              <span className="detail-label">Threat Level:</span>
              <span 
                className="detail-badge"
                style={{ backgroundColor: getSeverityColor(selectedCountry.avgSeverity) }}
              >
                {getSeverityLabel(selectedCountry.avgSeverity)}
              </span>
            </div>
            <div className="detail-stat">
              <span className="detail-label">Global Share:</span>
              <span className="detail-value">
                {((selectedCountry.attacks / stats.totalAttacks) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )} */
    </div>
  );
}

export default Heatmap;
