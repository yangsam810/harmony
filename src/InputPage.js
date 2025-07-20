import { type } from "@testing-library/user-event/dist/type";
import React, { useState } from "react";

const teamColors = [
  "#808000", "#ff3131", "#ffde59", "#ff914d", "#00bf63",
  "#8c52ff", "#469990", "#7ed957", "#ff66c4", "#000075"
];

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

buildingCatalog.sort((a,b) => a.name.localeCompare(b.name));

function getBoundsForRegion(index) {
  const latBands = 2;
  const lonBands = 5;
  const latRange = [-60, 75];
  const lonRange = [-180, 180];
  const latIndex = Math.floor(index / lonBands);
  const lonIndex = index % lonBands;
  const latMin = latRange[0] + latIndex * ((latRange[1] - latRange[0]) / latBands);
  const latMax = latRange[0] + (latIndex + 1) * ((latRange[1] - latRange[0]) / latBands);
  const lonMin = lonRange[0] + lonIndex * ((lonRange[1] - lonRange[0]) / lonBands);
  const lonMax = lonRange[0] + (lonIndex + 1) * ((lonRange[1] - lonRange[0]) / lonBands);
  return { latMin, latMax, lonMin, lonMax };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

const InputPage = () => {
  const [builder, setBuilder] = useState(0);
  const [target, setTarget] = useState(0);
  const [group, setGroup] = useState(0);
  const [buildingName, setBuildingName] = useState("");
  const [points, setPoints] = useState(0);
  const [income, setIncome] = useState(0);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(-1);
  const [round, setRound] = useState(1);

   const [totals, setTotals] = useState(
    Array.from({ length: 10 }, () => ({ income: 0, harmony: 0 }))
  );

  const [teamBuildings, setTeamBuildings] = useState(
    Array.from({ length: 10 }, () => [])
  );


  const sendUpdate = (action) => {
    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push(action);
    localStorage.setItem("actionQueue", JSON.stringify(queue));
  };

  const updateRound = (newRound) => {
    setRound(newRound);
    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push({ type: "setRound", round: newRound });
    localStorage.setItem("actionQueue", JSON.stringify(queue));
  };

  const handleDeleteBuilding = () => {
    if (selectedBuildingIndex < 0) return;

    const updatedBuildings = [...teamBuildings];
    const building = updatedBuildings[group][selectedBuildingIndex];

    // Remove from local buildings
    updatedBuildings[group].splice(selectedBuildingIndex, 1);
    setTeamBuildings(updatedBuildings);

    // Subtract from totals
    const updatedTotals = [...totals];
    updatedTotals[group].income -= building.income;
    updatedTotals[group].harmony -= building.harmony;
    setTotals(updatedTotals);

    // Tell the map to delete based on lat/lon
    sendUpdate({
      type: "deleteSpecificBuilding",
      group,
      lat: building.lat,
      lon: building.lon
    });

    // Reset selected index
    setSelectedBuildingIndex(-1);
  };

  const whitenRegion = (groupIndex) => {
    const backupKey = `whitenBackup-${groupIndex}`;
    const teams = JSON.parse(localStorage.getItem("teams") || "[]");

    const buildingsToBackup = teams[groupIndex]?.buildings?.map((b, idx) => ({
      index: idx,
      color: b.color
    })) || [];

    localStorage.setItem(backupKey, JSON.stringify(buildingsToBackup));

    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push({ type: "whitenBuildings", groupIndex });
    localStorage.setItem("actionQueue", JSON.stringify(queue));
  };

  const undoWhiten = (groupIndex) => {
    const backupKey = `whitenBackup-${groupIndex}`;
    const backup = JSON.parse(localStorage.getItem(backupKey) || "[]");

    if (!backup.length) {
      alert("No whiten data found for this group.");
      return;
    }

    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push({ type: "undoWhiten", groupIndex, backup });
    localStorage.setItem("actionQueue", JSON.stringify(queue));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Building</h2>
      <div>
        Builder:
        <select onChange={(e) => setBuilder(Number(e.target.value))}>
          {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
        </select>
        Target:
        <select onChange={(e) => setTarget(Number(e.target.value))}>
          {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
        </select>
        <select value={buildingName} onChange={(e) => setBuildingName(e.target.value)}>
          <option value="">-- Select Building --</option>
          {buildingCatalog.map((b, idx) => (
            <option key={idx} value={b.name}>{b.name}</option>
          ))}
        </select>
        <button onClick={() => {
          const selected = buildingCatalog.find(b => b.name === buildingName);
          if (!selected) return;
          const bounds = getBoundsForRegion(target);
          const lat = randomBetween(bounds.latMin, bounds.latMax);
          const lon = randomBetween(bounds.lonMin, bounds.lonMax);

          // Update local totals
          const updatedTotals = [...totals];
          updatedTotals[target].income += selected.income;
          updatedTotals[target].harmony += selected.harmony;
          setTotals(updatedTotals);
          sendUpdate({
            type: "addBuilding",
            builderIndex: builder,
            targetIndex: target,
            name: buildingName,
            lat,
            lon,
            buildingType: selected.type,
            income: selected.income,
            harmony: selected.harmony
          });
          const updatedBuildings = [...teamBuildings];
          updatedBuildings[target].push({
            name: selected.name,
            lat,
            lon,
            income: selected.income,
            harmony: selected.harmony
          });
          setTeamBuildings(updatedBuildings);
        }}>Add</button>
      </div>

      <h2>Update Stats</h2>
      <select onChange={(e) => setGroup(Number(e.target.value))}>
        {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
      </select>
      <input type="number" placeholder="Points" onChange={(e) => setPoints(Number(e.target.value))} />
      <button onClick={() => sendUpdate({ type: "updatePoints", group, points })}>Update Points</button>
      <input type="number" placeholder="Income" onChange={(e) => setIncome(Number(e.target.value))} />
      <button onClick={() => sendUpdate({ type: "updateIncome", group, income })}>Update Income</button>



      <h2>Whiten Buildings</h2>
      <button onClick={() => sendUpdate({ type: "whitenBuildings", group })}>Whiten</button>
      <button onClick={() => undoWhiten(group)}>Undo Whiten</button>

      <h3>Manual Team Totals</h3>
      <div>
        {totals.map((t, i) => (
          <div key={i}>
            <strong style={{ color: teamColors[i] }}>Team {i + 1}</strong> – Income: {t.income}, Harmony: {t.harmony}
          </div>
        ))}
      </div>

      <h3>Control Round</h3>
        <div>
          <button onClick={() => updateRound(round - 1)} disabled={round <= 1}>-</button>
          <span style={{ margin: "0 10px" }}>Round: {round}</span>
          <button onClick={() => updateRound(round + 1)}>+</button>
          <br /><br />
          <input
            type="number"
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
            min={1}
          />
          <button onClick={() => updateRound(round)}>Set Round</button>
        </div>

      <h3>Delete a Specific Building</h3>
      <div>
        Select Team:
        <select value={group} onChange={(e) => setGroup(Number(e.target.value))}>
          {teamColors.map((_, i) => (
            <option key={i} value={i}>Team {i + 1}</option>
          ))}
        </select>

        <br />

        Select Building:
        <select
          value={selectedBuildingIndex}
          onChange={(e) => setSelectedBuildingIndex(Number(e.target.value))}
        >
          <option value={-1}>-- Select --</option>
          {teamBuildings[group].map((b, i) => (
            <option key={i} value={i}>
              {b.name} @ {b.lat.toFixed(2)}, {b.lon.toFixed(2)}
            </option>
          ))}
        </select>

        <button onClick={handleDeleteBuilding} disabled={selectedBuildingIndex === -1}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default InputPage;
