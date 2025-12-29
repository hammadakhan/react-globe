import React, { useState, useEffect, useMemo, useRef } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { interpolateRdYlGn, interpolateYlOrRd, interpolateInferno, interpolateBlues } from "d3-scale-chromatic";
import { geoInterpolate, geoPath, geoMercator } from "d3-geo";
import axios from "axios";
import "./Heatmap.css";
import { Link } from "react-router-dom";

// GeoJSON URL for world map
const geoUrl = "/react-globe/ne_110m_admin_0_countries.geojson";

// ISO-2 to ISO-3 country code mapping
const iso2ToIso3 = {
  AF: "AFG", AX: "ALA", AL: "ALB", DZ: "DZA", AS: "ASM", AD: "AND", AO: "AGO", AI: "AIA",
  AQ: "ATA", AG: "ATG", AR: "ARG", AM: "ARM", AW: "ABW", AU: "AUS", AT: "AUT", AZ: "AZE",
  BS: "BHS", BH: "BHR", BD: "BGD", BB: "BRB", BY: "BLR", BE: "BEL", BZ: "BLZ", BJ: "BEN",
  BM: "BMU", BT: "BTN", BO: "BOL", BQ: "BES", BA: "BIH", BW: "BWA", BV: "BVT", BR: "BRA",
  IO: "IOT", BN: "BRN", BG: "BGR", BF: "BFA", BI: "BDI", KH: "KHM", CM: "CMR", CA: "CAN",
  CV: "CPV", KY: "CYM", CF: "CAF", TD: "TCD", CL: "CHL", CN: "CHN", CX: "CXR", CC: "CCK",
  CO: "COL", KM: "COM", CG: "COG", CD: "COD", CK: "COK", CR: "CRI", CI: "CIV", HR: "HRV",
  CU: "CUB", CW: "CUW", CY: "CYP", CZ: "CZE", DK: "DNK", DJ: "DJI", DM: "DMA", DO: "DOM",
  EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST", ET: "ETH", FK: "FLK",
  FO: "FRO", FJ: "FJI", FI: "FIN", FR: "FRA", GF: "GUF", PF: "PYF", TF: "ATF", GA: "GAB",
  GM: "GMB", GE: "GEO", DE: "DEU", GH: "GHA", GI: "GIB", GR: "GRC", GL: "GRL", GD: "GRD",
  GP: "GLP", GU: "GUM", GT: "GTM", GG: "GGY", GN: "GIN", GW: "GNB", GY: "GUY", HT: "HTI",
  HM: "HMD", VA: "VAT", HN: "HND", HK: "HKG", HU: "HUN", IS: "ISL", IN: "IND", ID: "IDN",
  IR: "IRN", IQ: "IRQ", IE: "IRL", IM: "IMN", IL: "ISR", IT: "ITA", JM: "JAM", JP: "JPN",
  JE: "JEY", JO: "JOR", KZ: "KAZ", KE: "KEN", KI: "KIR", KP: "PRK", KR: "KOR", KW: "KWT",
  KG: "KGZ", LA: "LAO", LV: "LVA", LB: "LBN", LS: "LSO", LR: "LBR", LY: "LBY", LI: "LIE",
  LT: "LTU", LU: "LUX", MO: "MAC", MK: "MKD", MG: "MDG", MW: "MWI", MY: "MYS", MV: "MDV",
  ML: "MLI", MT: "MLT", MH: "MHL", MQ: "MTQ", MR: "MRT", MU: "MUS", YT: "MYT", MX: "MEX",
  FM: "FSM", MD: "MDA", MC: "MCO", MN: "MNG", ME: "MNE", MS: "MSR", MA: "MAR", MZ: "MOZ",
  MM: "MMR", NA: "NAM", NR: "NRU", NP: "NPL", NL: "NLD", NC: "NCL", NZ: "NZL", NI: "NIC",
  NE: "NER", NG: "NGA", NU: "NIU", NF: "NFK", MP: "MNP", NO: "NOR", OM: "OMN", PK: "PAK",
  PW: "PLW", PS: "PSE", PA: "PAN", PG: "PNG", PY: "PRY", PE: "PER", PH: "PHL", PN: "PCN",
  PL: "POL", PT: "PRT", PR: "PRI", QA: "QAT", RE: "REU", RO: "ROU", RU: "RUS", RW: "RWA",
  BL: "BLM", SH: "SHN", KN: "KNA", LC: "LCA", MF: "MAF", PM: "SPM", VC: "VCT", WS: "WSM",
  SM: "SMR", ST: "STP", SA: "SAU", SN: "SEN", RS: "SRB", SC: "SYC", SL: "SLE", SG: "SGP",
  SX: "SXM", SK: "SVK", SI: "SVN", SB: "SLB", SO: "SOM", ZA: "ZAF", GS: "SGS", SS: "SSD",
  ES: "ESP", LK: "LKA", SD: "SDN", SR: "SUR", SJ: "SJM", SZ: "SWZ", SE: "SWE", CH: "CHE",
  SY: "SYR", TW: "TWN", TJ: "TJK", TZ: "TZA", TH: "THA", TL: "TLS", TG: "TGO", TK: "TKL",
  TO: "TON", TT: "TTO", TN: "TUN", TR: "TUR", TM: "TKM", TC: "TCA", TV: "TUV", UG: "UGA",
  UA: "UKR", AE: "ARE", GB: "GBR", US: "USA", UM: "UMI", UY: "URY", UZ: "UZB", VU: "VUT",
  VE: "VEN", VN: "VNM", VG: "VGB", VI: "VIR", WF: "WLF", EH: "ESH", YE: "YEM", ZM: "ZMB",
  ZW: "ZWE"
};

function Heatmap() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const colorScheme = "ylorrd"; // Fixed to yellow-orange-red theme
  const [tooltipContent, setTooltipContent] = useState("");
  const [heatmapData, setHeatmapData] = useState({});
  const [countryIPs, setCountryIPs] = useState({}); // Store IP details by country
  const [showIPModal, setShowIPModal] = useState(false);
  const [arcData, setArcData] = useState([]);
  const [countryCoordinates, setCountryCoordinates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

  // Fetch country coordinates
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

  // Fetch suspicious IPs data from API
  useEffect(() => {
    if (!Object.keys(countryCoordinates).length) return;
    
    setIsLoading(true);
    axios
      .get("http://172.190.180.89:85/dashboard-scheduler/suspicious-ips")
      .then((res) => {
        if (res.data.success && res.data.data?.agent_responses?.OpenSearchAgent?.answer) {
          const answer = res.data.data.agent_responses.OpenSearchAgent.answer;
          
          // Parse the answer to extract IP entries with source and destination
          // Match patterns like "IP: xxx.xxx.xxx.xxx\n   Geolocation: Source - XX (Country), Destination - YY (Country)"
          const ipPattern = /IP: ([\d.]+)\s+Geolocation: Source - ([A-Z]{2}) \([^)]+\), Destination - ([A-Z]{2}) \([^)]+\)/g;
          
          const countryCounts = {};
          const ipsByCountry = {}; // Store IPs per country
          const arcs = [];
          
          let match;
          while ((match = ipPattern.exec(answer)) !== null) {
            const ipAddress = match[1];
            const sourceIso2 = match[2];
            const destIso2 = match[3];
            const sourceIso3 = iso2ToIso3[sourceIso2];
            const destIso3 = iso2ToIso3[destIso2];
            
            // Count countries and store IP details
            if (sourceIso3) {
              countryCounts[sourceIso3] = (countryCounts[sourceIso3] || 0) + 1;
              if (!ipsByCountry[sourceIso3]) ipsByCountry[sourceIso3] = [];
              ipsByCountry[sourceIso3].push({
                ip: ipAddress,
                type: 'Source',
                destination: countryCoordinates[destIso2]?.name || destIso2
              });
            }
            if (destIso3) {
              countryCounts[destIso3] = (countryCounts[destIso3] || 0) + 1;
              if (!ipsByCountry[destIso3]) ipsByCountry[destIso3] = [];
              ipsByCountry[destIso3].push({
                ip: ipAddress,
                type: 'Destination',
                source: countryCoordinates[sourceIso2]?.name || sourceIso2
              });
            }
            
            // Create arc data if coordinates exist
            const sourceCoords = countryCoordinates[sourceIso2];
            const destCoords = countryCoordinates[destIso2];
            
            if (sourceCoords && destCoords && sourceIso2 !== destIso2) {
              // Skip arcs that cross the antimeridian (international date line)
              // These create problematic visualizations on 2D projections
              const lngDiff = Math.abs(destCoords.lng - sourceCoords.lng);
              if (lngDiff > 180) {
                // Skip this arc as it crosses the date line
                continue;
              }
              
              arcs.push({
                id: `${sourceIso2}-${destIso2}-${arcs.length}`,
                source: sourceIso2,
                destination: destIso2,
                sourceName: sourceCoords.name,
                destName: destCoords.name,
                startLat: sourceCoords.lat,
                startLng: sourceCoords.lng,
                endLat: destCoords.lat,
                endLng: destCoords.lng
              });
            }
          }
          
          // Transform to match expected format with attacks count
          const transformedData = {};
          Object.entries(countryCounts).forEach(([code, count]) => {
            transformedData[code] = {
              attacks: count,
              avgSeverity: count >= 10 ? 8.5 : count >= 5 ? 6.5 : 4.0
            };
          });
          
          setHeatmapData(transformedData);
          setCountryIPs(ipsByCountry);
          setArcData(arcs);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading suspicious IPs data:", err);
        setIsLoading(false);
      });
  }, [countryCoordinates]);

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
  const maxAttacks = useMemo(() => {
    const values = Object.values(heatmapData).map(d => d.attacks);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [heatmapData]);

  const colorScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxAttacks])
      .range([0, 1]);
  }, [maxAttacks]);

  const getColor = (attacks) => {
    // All countries use dark blue color
    return "#1a3a52";
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

  // Create projection instance that matches ComposableMap exactly
  const projection = useMemo(() => {
    const scale = dimensions.isMobile ? 100 : 147;
    // Match the viewBox dimensions of react-simple-maps
    const width = 800;
    const height = 400;
    
    return geoMercator()
      .scale(scale)
      .center([0, 20])
      .translate([width / 2, height / 2]);
  }, [dimensions.isMobile]);

  // Generate curved path for arc using great circle interpolation
  const generateArcPath = (fromCoords, toCoords) => {
    const interpolate = geoInterpolate(fromCoords, toCoords);
    const steps = 50;
    const coordinates = [];
    
    for (let i = 0; i <= steps; i++) {
      coordinates.push(interpolate(i / steps));
    }
    
    const pathGenerator = geoPath().projection(projection);
    return pathGenerator({ type: "LineString", coordinates });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const countries = Object.values(heatmapData);
    if (countries.length === 0) {
      return {
        totalAttacks: 0,
        avgSeverity: "0.0",
        criticalCount: 0,
        affectedCountries: 0
      };
    }
    
    const totalAttacks = countries.reduce((sum, d) => sum + d.attacks, 0);
    const avgSeverity = countries.reduce((sum, d) => sum + d.avgSeverity, 0) / countries.length;
    const criticalCount = countries.filter(d => d.avgSeverity >= 7).length;
    
    return {
      totalAttacks,
      avgSeverity: avgSeverity.toFixed(1),
      criticalCount,
      affectedCountries: countries.length
    };
  }, [heatmapData]);

  return (
    <div className="heatmap-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading suspicious IPs data...</div>
        </div>
      )}
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
                  const countryData = heatmapData[countryCode];
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
                          fill: "#4da6ff",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#0080ff",
                          outline: "none"
                        }
                      }}
                      onMouseEnter={() => {
                        if (countryData) {
                          setTooltipContent(`${countryName}: ${countryData.attacks} suspicious IPs`);
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
                          setShowIPModal(true);
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
          
          {/* Animated Arcs Layer - rendered outside ZoomableGroup for proper positioning */}
          <g className="arcs-layer">
            {arcData.map((arc, index) => {
              const pathString = generateArcPath(
                [arc.startLng, arc.startLat],
                [arc.endLng, arc.endLat]
              );
              
              if (!pathString) return null;
              
              return (
                <g key={arc.id}>
                  {/* Arc path */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke="rgba(0, 200, 255, 0.6)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    className="arc-line"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  />
                  
                  {/* Traveling dots - 3 per arc */}
                  {[0, 1, 2].map((dotIndex) => (
                    <circle
                      key={`${arc.id}-dot-${dotIndex}`}
                      r={2.5}
                      fill="#00ffff"
                      className="traveling-dot"
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 1))'
                      }}
                    >
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={pathString}
                        begin={`${dotIndex * 1}s`}
                      />
                    </circle>
                  ))}
                </g>
              );
            })}
          </g>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div className="map-tooltip">
            {tooltipContent}
          </div>
        )}
      </div>

      {/* IP Details Modal */}
      {showIPModal && selectedCountry && (
        <div className="ip-modal-overlay" onClick={() => setShowIPModal(false)}>
          <div className="ip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ip-modal-header">
              <h2>{selectedCountry.name} - IP Details</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowIPModal(false)}
              >
                ✖
              </button>
            </div>
            <div className="ip-modal-content">
              <div className="ip-stats">
                <div className="ip-stat-item">
                  <span className="ip-stat-label">Total Suspicious IPs:</span>
                  <span className="ip-stat-value">{countryIPs[selectedCountry.code]?.length || 0}</span>
                </div>
                <div className="ip-stat-item">
                  <span className="ip-stat-label">Attack Count:</span>
                  <span className="ip-stat-value">{selectedCountry.attacks}</span>
                </div>
              </div>
              <div className="ip-list-container">
                <h3>IP Addresses</h3>
                <div className="ip-list">
                  {countryIPs[selectedCountry.code]?.map((ipInfo, idx) => (
                    <div key={idx} className="ip-item">
                      <div className="ip-address">{ipInfo.ip}</div>
                      <div className="ip-details">
                        <span className="ip-type" data-type={ipInfo.type.toLowerCase()}>
                          {ipInfo.type}
                        </span>
                        <span className="ip-connection">
                          {ipInfo.type === 'Source' ? `→ ${ipInfo.destination}` : `← ${ipInfo.source}`}
                        </span>
                      </div>
                    </div>
                  )) || <p>No IP details available</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Country Details Panel
      {selectedCountry && (
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
      )} */}
    </div>
  );
}

export default Heatmap;
