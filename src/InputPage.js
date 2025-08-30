import { s } from "framer-motion/client";
import React, { useState, useEffect } from "react";

const teamColors = [
  "#469990", "#ff3131", "#ffde59", "#ff914d", "#00bf63",
  "#8c52ff", "#808000", "#7ed957", "#ff66c4", "#000075",
  "#00f7ff"
];

const buildingCatalog = [
  // Economy buildings
  { name: "Cafe", type: "economy", income: 200, harmony: 0 },
  { name: "Restaurant", type: "economy", income: 200, harmony: 0 },
  { name: "Bakery", type: "economy", income: 300, harmony: 0 },
  { name: "Bank", type: "economy", income: 300, harmony: 0 },
  { name: "Mall", type: "economy", income: 300, harmony: 0 },
  { name: "Insurance", type: "economy", income: 200, harmony: 0 },
  { name: "Stationery", type: "economy", income: 200, harmony: 0 },
  { name: "Supermarket", type: "economy", income: 300, harmony: 0 },
  { name: "Hotel", type: "economy", income: 300, harmony: 0 },
  { name: "Gas Station", type: "economy", income: 300, harmony: 0 },
  { name: "Greenhouse", type: "economy", income: 200, harmony: 0 },
  { name: "Casino", type: "economy", income: 1000, harmony: -30 },
  { name: "Dispensary", type: "economy", income: 700, harmony: -30 },

  // Harmony buildings
  { name: "Hospital", type: "harmony", income: 50, harmony: 5 },
  { name: "Parks", type: "harmony", income: 0, harmony: 10 },
  { name: "Museum", type: "harmony", income: 0, harmony: 10 },
  { name: "Library", type: "harmony", income: 0, harmony: 10 },
  { name: "Community Centre", type: "harmony", income: 0, harmony: 15 },
  { name: "Theatre", type: "harmony", income: 0, harmony: 10 },
  { name: "Fire Hall", type: "harmony", income: 0, harmony: 10 },
  { name: "Care Home", type: "harmony", income: 0, harmony: 15 },
  { name: "Day Care", type: "harmony", income: 0, harmony: 15 },
  { name: "Police Station", type: "harmony", income: 0, harmony: 10 },
  { name: "Post Office", type: "harmony", income: 0, harmony: 10 },
  { name: "School", type: "harmony", income: 0, harmony: 10 },
  { name: "Amusement Park", type: "harmony", income: 50, harmony: 5 },
  { name: "HH", type: "special", income: 0, harmony: 20 },
  { name: "Airport", type: "special", income: 0, harmony: 10}
];

buildingCatalog.sort((a,b) => a.name.localeCompare(b.name));

function getBoundsForRegion(index) {
  const lonDivisions = 5; // 5個經度區間
  const lonRange = [-180, 180];
  
  // 計算經度範圍的步長
  const lonStep = (lonRange[1] - lonRange[0]) / lonDivisions; // 72度

  if (index < 5) {
    // 前5組：北半球 (10到75度)
    const lonIndex = index;
    const lonMin = lonRange[0] + lonIndex * lonStep;
    const lonMax = lonRange[0] + (lonIndex + 1) * lonStep;
    
    return {
      latMin: 10,
      latMax: 75,
      lonMin: lonMin,
      lonMax: lonMax
    };
  } else if (index < 10) {
    // 第6-10組：南半球上半部 (-65到10度)
    const lonIndex = index - 5; // 調整索引從0開始
    const lonMin = lonRange[0] + lonIndex * lonStep;
    const lonMax = lonRange[0] + (lonIndex + 1) * lonStep;
    
    return {
      latMin: -65,
      latMax: 10,
      lonMin: lonMin,
      lonMax: lonMax
    };
  } else {
    // 第11組：南極區域 (-77到-65度)
    return {
      latMin: -77,
      latMax: -65,
      lonMin: -180,
      lonMax: 180
    };
  }
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

  // Timer states
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [timerActive, setTimerActive] = useState(false);
  
  // Audio states
  const [roundEndAudio, setRoundEndAudio] = useState(null);
  const [round6Audio, setRound6Audio] = useState(null);
  const [isRound6AudioPlaying, setIsRound6AudioPlaying] = useState(false);
  const [hasPlayedRound6Audio, setHasPlayedRound6Audio] = useState(false);

  // Team checkbox states - 新增
  const [teamCheckboxes, setTeamCheckboxes] = useState(
    Array.from({ length: 11 }, () => ({ checkbox1: false, checkbox2: false, checkbox3: false, checkbox4: false, checkbox5: false,checkbox6: false, checkbox7: false }))
  );

  const [totals, setTotals] = useState(
    Array.from({ length: 11 }, () => ({ income: 0, harmony: 0, points: 0 }))
  );

  const [teamBuildings, setTeamBuildings] = useState(
    Array.from({ length: 11 }, () => [])
  );

  // Initialize audio objects
  useEffect(() => {
    // 時間到播放的音檔 - 使用一個示例音檔URL，你需要替換成實際的音檔路徑
    const endAudio = new Audio('/changing.mp3'); // 替換成你的音檔路徑
    endAudio.volume = 0.7;
    setRoundEndAudio(endAudio);
    
    // 第六局1分鐘警告音檔
    const warning6Audio = new Audio('/chrbg.mp3'); // 替換成你的音檔路徑
    warning6Audio.volume = 0.8;
    setRound6Audio(warning6Audio);
    
    return () => {
      // 清理音檔
      if (endAudio) {
        endAudio.pause();
        endAudio.currentTime = 0;
      }
      if (warning6Audio) {
        warning6Audio.pause();
        warning6Audio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {

      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        // Send timer update to MapPage
        sendUpdate({
          type: "updateTimer",
          timeLeft: timeLeft - 1,
          timerActive: true
        });
      }, 1000);
      if( timeLeft== 60 && round === 6 ){
        round6Audio.play().catch(console.error);
        setHasPlayedRound6Audio(true);
        setIsRound6AudioPlaying(true);
        sendUpdate({
          type: "updateRound6Audio",
          isPlaying: true
        });
      }
 
    } else if (timeLeft === 0) {
      setTimerActive(false);
      playEndSound();
      startTimer();
      sendUpdate({
        type: "updateTimer",
        timeLeft: 0,
        timerActive: false
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timerActive, timeLeft]);

  const sendUpdate = (action) => {
    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push(action);
    localStorage.setItem("actionQueue", JSON.stringify(queue));
    
    // Trigger storage event manually for same-page updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'actionQueue',
      newValue: JSON.stringify(queue)
    }));
  };

  const updateRound = (newRound) => {
    setRound(newRound);
    // 當回合變更時重置第六局音檔標記
    if (newRound !== 6  ||  newRound !== 7) {
      setHasPlayedRound6Audio(false);
      if (round6Audio && isRound6AudioPlaying && newRound!==7) {
        round6Audio.pause();
        round6Audio.currentTime = 0;
        setIsRound6AudioPlaying(false);
        sendUpdate({
          type: "updateRound6Audio",
          isPlaying: false
        });
      }
    }
    sendUpdate({ type: "setRound", round: newRound });
  };

  // Timer control functions
  const startTimer = () => {
    setTimeLeft(10 * 60);
    setTimerActive(true);
    updateRound(round + 1)
    // 如果是新回合，重置第六局音檔標記
    if (round !== 6 || round !== 7) {
      setHasPlayedRound6Audio(false);
    }

    if(round === 6) {
      roundEndAudio.pause()
      roundEndAudio.currentTime=0;
    }
    
    sendUpdate({
      type: "updateTimer",
      timeLeft: 10 * 60,
      timerActive: true
    });
  };

  const toggleTimer = () => {
    const newActive = !timerActive;
    setTimerActive(newActive);
    sendUpdate({
      type: "updateTimer",
      timeLeft: timeLeft,
      timerActive: newActive
    });
  };

  const resetTimer = () => {
    setTimeLeft(0.1 * 60);
    setTimerActive(false);
    
    // 停止第六局音檔
    if (round6Audio && isRound6AudioPlaying) {
      round6Audio.pause();
      round6Audio.currentTime = 0;
      setIsRound6AudioPlaying(false);
      sendUpdate({
        type: "updateRound6Audio",
        isPlaying: false
      });
    }
    
    // 重置第六局音檔標記
    setHasPlayedRound6Audio(false);
    
    sendUpdate({
      type: "updateTimer",
      timeLeft: 10 * 60,
      timerActive: false
    });
  };

  const playEndSound = () => {
    roundEndAudio.play().catch(console.error);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Round 6 audio control functions
  const toggleRound6Audio = () => {
    if (!round6Audio) return;
    
    if (isRound6AudioPlaying) {
      round6Audio.pause();
      setIsRound6AudioPlaying(false);
      sendUpdate({
        type: "updateRound6Audio",
        isPlaying: false
      });
    } else {
      round6Audio.play().catch(console.error);
      setIsRound6AudioPlaying(true);
      sendUpdate({
        type: "updateRound6Audio",
        isPlaying: true
      });
    }
  };

  const stopRound6Audio = () => {
    if (!round6Audio) return;
    
    round6Audio.pause();
    round6Audio.currentTime = 0;
    setIsRound6AudioPlaying(false);
    sendUpdate({
      type: "updateRound6Audio",
      isPlaying: false
    });
  };

  // 新增：更新builder時自動設置target為同一組
  const handleBuilderChange = (newBuilder) => {
    setBuilder(newBuilder);
    setTarget(newBuilder); // 自動設置target為相同的組
  };

  // 新增：處理checkbox變更
  const handleCheckboxChange = (teamIndex, checkboxType) => {
    const newCheckboxes = [...teamCheckboxes];
    newCheckboxes[teamIndex][checkboxType] = !newCheckboxes[teamIndex][checkboxType];
    setTeamCheckboxes(newCheckboxes);
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
    <div style={{ padding: 20, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Timer Control Section - 置於頂部 */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "30px",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}>
        <h2 style={{ margin: "0 0 15px 0", textAlign: "center" }}>🎮 Timer Control Panel</h2>
        
        <div style={{
          background: timeLeft <= 60 ? "rgba(255,107,107,0.3)" : "rgba(255,255,255,0.2)",
          borderRadius: "8px",
          padding: "15px",
          textAlign: "center",
          marginBottom: "15px"
        }}>
          <div style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "10px"
          }}>
            ⏰ {formatTime(timeLeft)}
          </div>
          
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={toggleTimer}
              style={{
                background: timerActive ? "#FF6B6B" : "#4ECDC4",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease"
              }}
            >
              {timerActive ? "⏸️ Pause" : "▶️ Start"}
            </button>
            
            <button
              onClick={resetTimer}
              style={{
                background: "#764ba2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease"
              }}
            >
              🔄 reset
            </button>
            
            <button
              onClick={startTimer}
              style={{
                background: "#00bf63",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease"
              }}
            >
              🚀 Next Round
            </button>
          </div>

          {timeLeft <= 60 && timeLeft > 0 && (
            <div style={{
              marginTop: "10px",
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#FFE66D",
              animation: "blink 1s infinite"
            }}>
              ⚠️ Less than one minute！
            </div>
          )}

          {timeLeft === 0 && (
            <div style={{
              marginTop: "10px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#FF6B6B"
            }}>
              ⏰ Time's up！
            </div>
          )}
        </div>

        {/* Round 6 Audio Control - 只在第六局顯示 */}
        {(round === 6 || round === 7) && (
          <div style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "8px",
            padding: "12px",
            marginTop: "10px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "white", textAlign: "center" }}>
              🎵 Round 6 Audio Control
            </h4>
            <div style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={toggleRound6Audio}
                style={{
                  background: isRound6AudioPlaying ? "#FF6B6B" : "#4ECDC4",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                {isRound6AudioPlaying ? "🔇 Pause" : "🎵 Play"}
              </button>
              
              <button
                onClick={stopRound6Audio}
                style={{
                  background: "#764ba2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                🛑 Stop
              </button>
            </div>
            
            {timeLeft <= 120 && timeLeft > 0 && round === 6 && (
              <div style={{
                marginTop: "8px",
                fontSize: "0.8rem",
                color: "#FFE66D",
                textAlign: "center",
                fontWeight: "bold"
              }}>
                🎵 Round 6 Warning Music {hasPlayedRound6Audio ? "(已觸發)" : "(待觸發)"}
              </div>
            )}
          </div>
        )}
      </div>

      <h2>Add Building</h2>
      <div style={{ marginBottom: "20px" }}>
        Builder:
        <select onChange={(e) => handleBuilderChange(Number(e.target.value))} style={{ margin: "0 10px" }}>
          {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
        </select>
        Target:
        <select value={target} onChange={(e) => setTarget(Number(e.target.value))} style={{ margin: "0 10px" }}>
          {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
        </select>
        <select value={buildingName} onChange={(e) => setBuildingName(e.target.value)} style={{ margin: "0 10px" }}>
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
            builderIndex: builder+1,
            name: selected.name,
            lat,
            lon,
            income: selected.income,
            harmony: selected.harmony
          });
          setTeamBuildings(updatedBuildings);
        }} style={{ 
          background: "#4ECDC4", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer"
        }}>Add</button>
      </div>

      <h2>Update Stats</h2>
      <div style={{ marginBottom: "20px" }}>
        <select onChange={(e) => setGroup(Number(e.target.value))} style={{ margin: "0 10px" }}>
          {teamColors.map((_, i) => <option key={i} value={i}>Team {i + 1}</option>)}
        </select>
        <input type="number" placeholder="Points" onChange={(e) => setPoints(Number(e.target.value))} style={{ margin: "0 10px" }} />
        <button onClick={() => {
          const updatedTotals = [...totals];
          updatedTotals[group].points = points;
          setTotals(updatedTotals);
          sendUpdate({ type: "updatePoints", group, points });
        }} style={{ 
          background: "#667eea", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer",
          margin: "0 5px"
        }}>Update Points</button>
        <input type="number" placeholder="Income" onChange={(e) => setIncome(Number(e.target.value))} style={{ margin: "0 10px" }} />
        <button onClick={() => {
          const updatedTotals = [...totals];
          updatedTotals[group].income = income;
          setTotals(updatedTotals);
          sendUpdate({ type: "updateIncome", group, income });
        }} style={{ 
          background: "#00bf63", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer"
        }}>Update Income</button>
      </div>

      <h2>Whiten Buildings</h2>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => sendUpdate({ type: "whitenBuildings", group })} style={{ 
          background: "#FF6B6B", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer",
          margin: "0 5px"
        }}>Whiten</button>
        <button onClick={() => undoWhiten(group)} style={{ 
          background: "#764ba2", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer"
        }}>Undo Whiten</button>
      </div>

      <h3>Manual Team Totals</h3>
      <div style={{ marginBottom: "20px" }}>
        {totals.map((t, i) => (
          <div key={i} style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "8px",
            padding: "8px",
            background: "rgba(248,249,250,0.8)",
            borderRadius: "8px",
            border: `2px solid ${teamColors[i]}40`
          }}>
            {/* 在每一組前面增加兩個checkbox */}
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox1}
              onChange={() => handleCheckboxChange(i, 'checkbox1')}
              style={{ marginRight: "8px" }}
            />
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox2}
              onChange={() => handleCheckboxChange(i, 'checkbox2')}
              style={{ marginRight: "12px" }}
            />
            <strong style={{ color: teamColors[i], minWidth: "80px" }}>Team {i + 1}</strong>
            <span style={{ marginLeft: "10px", marginRight: "12px" }}>
              Income: {t.income}, Harmony: {t.harmony}, Points: {t.points || 0}
            </span>
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox3}
              onChange={() => handleCheckboxChange(i, 'checkbox3')}
              style={{ marginRight: "8px" }}
            />
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox4}
              onChange={() => handleCheckboxChange(i, 'checkbox4')}
              style={{ marginRight: "12px" }}
            />
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox5}
              onChange={() => handleCheckboxChange(i, 'checkbox5')}
              style={{ marginRight: "8px" }}
            />
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox6}
              onChange={() => handleCheckboxChange(i, 'checkbox6')}
              style={{ marginRight: "12px" }}
            />
            <input
              type="checkbox"
              checked={teamCheckboxes[i].checkbox7}
              onChange={() => handleCheckboxChange(i, 'checkbox7')}
              style={{ marginRight: "8px" }}
            />
          </div>
        ))}
      </div>

      <h3>Control Round</h3>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => updateRound(round - 1)} disabled={round <= 1} style={{ 
          background: round <= 1 ? "#ccc" : "#667eea", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: round <= 1 ? "not-allowed" : "pointer",
          margin: "0 5px"
        }}>-</button>
        <span style={{ margin: "0 10px", fontWeight: "bold" }}>Round: {round}</span>
        <button onClick={() => updateRound(round + 1)} style={{ 
          background: "#667eea", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer"
        }}>+</button>
        <br /><br />
        <input
          type="number"
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
          min={1}
          style={{ margin: "0 10px" }}
        />
        <button onClick={() => updateRound(round)} style={{ 
          background: "#4ECDC4", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          padding: "8px 16px",
          cursor: "pointer"
        }}>Set Round</button>
      </div>

      <h3>Delete a Specific Building</h3>
      <div>
        Select Team:
        <select value={group} onChange={(e) => setGroup(Number(e.target.value))} style={{ margin: "0 10px" }}>
          {teamColors.map((_, i) => (
            <option key={i} value={i}>Team {i + 1}</option>
          ))}
        </select>

        <br /><br />

        Select Building:
        <select
          value={selectedBuildingIndex}
          onChange={(e) => setSelectedBuildingIndex(Number(e.target.value))}
          style={{ margin: "0 10px" }}
        >
          <option value={-1}>-- Select --</option>
          {teamBuildings[group].map((b, i) => (
            <option key={i} value={i}>
              {b.name} @ {b.lat.toFixed(2)}, {b.lon.toFixed(2)}, {b.builderIndex}
            </option>
          ))}
        </select>

        <button 
          onClick={handleDeleteBuilding} 
          disabled={selectedBuildingIndex === -1}
          style={{ 
            background: selectedBuildingIndex === -1 ? "#ccc" : "#FF6B6B", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            padding: "8px 16px",
            cursor: selectedBuildingIndex === -1 ? "not-allowed" : "pointer"
          }}
        >
          Delete
        </button>
      </div>

      {/* CSS for blinking animation */}
      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3) !important;
          }
        `}
      </style>
    </div>
  );
};

export default InputPage;