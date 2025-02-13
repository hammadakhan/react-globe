import React, { useState, useEffect, useMemo } from "react";
import Globe from "react-globe.gl";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import axios from "axios";
import "./App.css";

function App() {
  const [countries, setCountries] = useState({ features: [] });
  const [attackData, setAttackData] = useState({});
  const [hoverD, setHoverD] = useState();

  useEffect(() => {
    fetch("/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => setCountries(data));

    axios.get("/api/v2/victims/2024")
      .then((res) => {
        const attacks = res.data.reduce((acc, item) => {
          acc[item.country] = (acc[item.country] || 0) + 1;
          return acc;
        }, {});
        setAttackData(attacks);
      })
      .catch((error) => console.error("Error fetching ransomware data:", error));
  }, []);

  const colorScale = scaleSequentialSqrt(interpolateYlOrRd);
  const maxVal = useMemo(() => Math.max(...Object.values(attackData), 1), [attackData]);
  colorScale.domain([0, maxVal]);

  return (
    <div className="globe-container">
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        width={window.innerWidth}
        height={window.innerHeight}
        polygonsData={countries.features}
        polygonAltitude={(d) => (d === hoverD ? 0.12 : 0.06)}
        polygonCapColor={(d) => colorScale(attackData[d.properties.ISO_A2] || 0)}
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={({ properties: d }) => `
          <b>${d.NAME_LONG}</b><br />
          Attacks: <i>${attackData[d.ISO_A2] || 0}</i>
        `}
        onPolygonHover={setHoverD}
        polygonsTransitionDuration={300}
      />
    </div>
  );
}

export default App;
