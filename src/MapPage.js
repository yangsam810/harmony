import React from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

const worldBounds = [[-60, -180], [75, 180]];
const regionBounds = [[-60, -180], [75, 180]];

const generateLandRegions = () => {
  const latDivisions = 2;
  const lonDivisions = 5;
  const latRange = [-60, 75];
  const lonRange = [-180, 180];

  const regions = [];

  for (let i = 0; i < latDivisions; i++) {
    for (let j = 0; j < lonDivisions; j++) {
      const south = latRange[0] + i * ((latRange[1] - latRange[0]) / latDivisions);
      const north = latRange[0] + (i + 1) * ((latRange[1] - latRange[0]) / latDivisions);
      const west = lonRange[0] + j * ((lonRange[1] - lonRange[0]) / lonDivisions);
      const east = lonRange[0] + (j + 1) * ((lonRange[1] - lonRange[0]) / lonDivisions);

      regions.push([
        [south, west],
        [south, east],
        [north, east],
        [north, west]
      ]);
    }
  }

  return regions;
};

const getIconHtml = (building) => {
  if (building.name === "Airport") return "✈️";
  if (building.name === "HH") return "HH";
  if (building.type === "economy") return "$";
  if (building.type === "harmony") return "h";
  return "🏗️";
};


const MapPage = ({ teams, round } ) => {
  const regions = generateLandRegions();
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <MapContainer 
        center={[10, 0]}
        zoom={2}
        maxBounds={regionBounds}
        maxZoom={4}
        minZoom={2}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false} 
        style={{ width: "70%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {regions.map((coords, i) => (
          <Polygon
            key={i}
            positions={coords}
            pathOptions={{ color: teams[i].color, fillOpacity: 0.3 }}
          />
        ))}
        {teams.map((team, i) =>
          team.buildings.map((b, j) => (
            <Marker
              key={i + '-' + j}
              position={[b.lat, b.lon]}
              icon={L.divIcon({
                className: '',
                html: `<div style="color:${b.color};font-weight:bold;font-size:24px;">${getIconHtml(b)}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>{b.name}</Popup>
            </Marker>
          ))
        )}
      </MapContainer>

      <div style={{ width: "30%", padding: 10, overflowY: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px"
          }}
        >
          <AnimatePresence>
            {sortedTeams.map((team, i) => (
              <motion.div
                key={team.name} // use unique ID if available
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
              >
                <h3 style={{ color: team.color, marginBottom: "6px", fontSize: "1.1rem" }}>
                  {team.name}
                </h3>
                <div style={{ fontSize: "1rem", marginBottom: 4 }}>
                  <strong>Points:</strong> {team.points}
                </div>
                <div style={{ background: "#eee", height: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      width: `${Math.min(team.points, 100)}%`,
                      background: team.color,
                      height: "100%"
                    }}
                  />
                </div>
                <div style={{ fontSize: "1rem" }}>
                  <strong>Income:</strong> {team.income}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          fontSize: "7.5rem",
          fontWeight: "bold"
        }}>
          Round: {round}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
