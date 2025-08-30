import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./MapPage";
import InputPage from "./InputPage";



function App() {
  const [teams, setTeams] = useState(
    Array.from({ length: 11 }, (_, i) => ({
      name: `Team ${i + 1}`,
      color: [
        "#469990", "#ff3131", "#ffde59", "#ff914d", "#00bf63",
        "#8c52ff", "#808000", "#7ed957", "#ff66c4", "#000075",
        "#00f7ff"
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
              break;
            }
            case "updateTimer": {
              // Timer updates are handled directly in MapPage component
              // No need to process here, just let it pass through
              break;
            }
            /*case "undoWhiten": {
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
            }*/
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