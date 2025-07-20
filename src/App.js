import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./MapPage";
import InputPage from "./InputPage";

const buildingCatalog = [
  // Economy buildings
  { name: "Cafe", type: "economy", income: 200, harmony: 0 },
  { name: "Restaurant", type: "economy", income: 200, harmony: 0 },
  { name: "Bakery", type: "economy", income: 200, harmony: 0 },
  { name: "Bank", type: "economy", income: 200, harmony: 0 },
  { name: "Mall", type: "economy", income: 200, harmony: 0 },
  { name: "Insurance", type: "economy", income: 200, harmony: 0 },
  { name: "Stationery", type: "economy", income: 200, harmony: 0 },
  { name: "Supermarket", type: "economy", income: 200, harmony: 0 },
  { name: "Hotel", type: "economy", income: 200, harmony: 0 },
  { name: "Gas Station", type: "economy", income: 200, harmony: 0 },
  { name: "Greenhouse", type: "economy", income: 200, harmony: 0 },
  { name: "Casino", type: "economy", income: 200, harmony: 0 },
  { name: "Dispensary", type: "economy", income: 200, harmony: 0 },

  // Harmony buildings
  { name: "Hospital", type: "harmony", income: 0, harmony: 10 },
  { name: "Parks", type: "harmony", income: 0, harmony: 10 },
  { name: "Airport", type: "special", income: 0, harmony: 10 },
  { name: "Museum", type: "harmony", income: 0, harmony: 10 },
  { name: "Library", type: "harmony", income: 0, harmony: 10 },
  { name: "Community Centre", type: "harmony", income: 0, harmony: 10 },
  { name: "Theatre", type: "harmony", income: 0, harmony: 10 },
  { name: "Fire Hall", type: "harmony", income: 0, harmony: 10 },
  { name: "Care Home", type: "harmony", income: 0, harmony: 10 },
  { name: "Day Care", type: "harmony", income: 0, harmony: 10 },
  { name: "Police Station", type: "harmony", income: 0, harmony: 10 },
  { name: "Post Office", type: "harmony", income: 0, harmony: 10 },
  { name: "Amusement Park", type: "harmony", income: 0, harmony: 10 },
  { name: "HH", type: "special", income: 0, harmony: 10 },
  { name: "Airport", type: "special", income: 0, harmony: 10}
];

function App() {
  const [teams, setTeams] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      name: `Team ${i + 1}`,
      color: [
        "#808000", "#ff3131", "#ffde59", "#ff914d", "#00bf63",
        "#8c52ff", "#469990", "#7ed957", "#ff66c4", "#000075"
      ][i],
      points: 0,
      income: 0,
      buildings: []
    }))
  );

  const [round, setRound] = useState(1);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== "actionQueue") return;

      const stored = localStorage.getItem("actionQueue");
      if (!stored) return;

      const actions = JSON.parse(stored);
      if (actions.length === 0) return;

      setTeams((prev) => {
        const updated = [...prev];
        actions.forEach((action) => {
          switch (action.type) {
            case "addBuilding": {
              const { builderIndex, targetIndex, name, lat, lon } = action;
              updated[targetIndex].buildings.push({
                name,
                color: updated[builderIndex].color,
                lat,
                lon,
                type: action.buildingType,
                income: action.income,
                harmony: action.harmony
              });
              break;
            }
            case "deleteSpecificBuilding": {
              const { group, lat, lon } = action;
              updated[group].buildings = updated[group].buildings.filter(
                (b) => b.lat !== lat || b.lon !== lon
              );
              break;
            }
            case "whitenBuildings": {
              updated[action.group].buildings = updated[action.group].buildings.map((b) => ({ ...b, color: "#ffffff" }));
              break;
            }
            case "updatePoints": {
              updated[action.group].points = action.points;
              break;
            }
            case "updateIncome": {
              updated[action.group].income = action.income;
              break;
            }
            case "setRound" : {
              setRound(action.round);
            }
            case "undoWhiten": {
              const { groupIndex, backup } = action;
              const newTeams = [...prevTeams];
              if (newTeams[groupIndex]) {
                backup.forEach(({ index, color }) => {
                  if (newTeams[groupIndex].buildings[index]) {
                    newTeams[groupIndex].buildings[index].color = color;
                  }
                });
              }
              return newTeams;
            }
            default:
              break;
          }
        });
        return updated;
      });

      localStorage.setItem("actionQueue", JSON.stringify([]));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage teams={teams} round={round} />} />
        <Route path="/input" element={<InputPage />} />
      </Routes>
    </Router>
  );
}

export default App;
