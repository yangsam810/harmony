import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

const regionBounds = [[-90, -180], [90, 180]];

const generateLandRegions = () => {
  const regions = [];
  const lonDivisions = 5; // 5個經度區間
  const lonRange = [-180, 180];

  // 上半部分：北半球 (10到75度) - 給1-5組
  for (let j = 0; j < lonDivisions; j++) {
    const west = lonRange[0] + j * ((lonRange[1] - lonRange[0]) / lonDivisions);
    const east = lonRange[0] + (j + 1) * ((lonRange[1] - lonRange[0]) / lonDivisions);
    
    regions.push([
      [10, west],    // 南邊界：10度
      [10, east],
      [75, east],   // 北邊界：75度
      [75, west],
    ]);
  }

  // 下半部分：南半球上半部 (-65到10度) - 給6-10組
  const southDivisions = 5;
  for (let j = 0; j < southDivisions; j++) {
    const west = lonRange[0] + j * ((lonRange[1] - lonRange[0]) / southDivisions);
    const east = lonRange[0] + (j + 1) * ((lonRange[1] - lonRange[0]) / southDivisions);
    
    regions.push([
      [-65, west],  // 南邊界：-65度
      [-65, east],
      [10, east],    // 北邊界：10度
      [10, west],
    ]);
  }

  // 南極區域（第11個區域）
  const antarctic = [
    [-77, -180],
    [-77, 180],
    [-65, 180],
    [-65, -180],
  ];
  regions.push(antarctic);

  return regions;
};

const getIconHtml = (building) => {
  if (building.name === "Airport") return "✈️";
  if (building.name === "HH") return "HH";
  if (building.type === "economy") return "$";
  if (building.type === "harmony") return "H";
  return "🏗️";
};

const MapPage = ({ teams, round }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 計時器相關狀態 - 只接收來自InputPage的數據
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 監聽來自InputPage的計時器更新
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== "actionQueue") return;

      const stored = localStorage.getItem("actionQueue");
      if (!stored) return;

      const actions = JSON.parse(stored);
      if (actions.length === 0) return;

      actions.forEach((action) => {
        if (action.type === "updateTimer") {
          setTimeLeft(action.timeLeft);
          setTimerActive(action.timerActive);
        }
      });
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 格式化時間顯示
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 根據視窗大小計算地圖設定
  const getMapSettings = () => {
    const aspectRatio = windowSize.width / windowSize.height;
    
    if (aspectRatio > 2) {
      return { center: [7.5, 0], zoom: 2, minZoom: 1, maxZoom: 5 };
    } else if (aspectRatio > 1.5) {
      return { center: [7.5, 0], zoom: 1, minZoom: 1, maxZoom: 5 };
    } else if (aspectRatio > 1) {
      return { center: [7.5, 0], zoom: 1.5, minZoom: 1, maxZoom: 4 };
    } else {
      return { center: [7.5, 0], zoom: 1.2, minZoom: 1, maxZoom: 4 };
    }
  };

  // 計算微調縮放的 CSS transform
  const getMapTransform = () => {
    const aspectRatio = windowSize.width / windowSize.height;
    
    if (aspectRatio > 2) {
      return 'scale(1)';
    } else if (aspectRatio > 1.5) {
      return 'scale(2)';
    } else if (aspectRatio > 1) {
      return 'scale(1.0)';
    } else {
      return 'scale(0.95)';
    }
  };

  // 根據螢幕大小決定佈局
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width < 1024;

  const regions = generateLandRegions();
  const mapSettings = getMapSettings();
  
  // 計算每個團隊的總計
  const teamTotals = teams.map(team => {
    const totalIncome = team.buildings.reduce((sum, building) => sum + (building.income || 0), 0);
    const totalHarmony = team.buildings.reduce((sum, building) => sum + (building.harmony || 0), 0);
    return { ...team, totalIncome, totalHarmony };
  });
  
  // 按分數排序團隊
  const sortedTeamsWithTotals = teamTotals.sort((a, b) => b.points - a.points);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: isMobile ? "column" : "row",
      height: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Map Container */}
      <div style={{ 
        flex: isMobile ? "1" : "1", 
        height: isMobile ? "60vh" : "100vh",
        position: "relative",
        borderRadius: isMobile ? "0" : "0 20px 20px 0",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        transform: getMapTransform(),
        transformOrigin: "center center"
      }}>
        <MapContainer 
          center={mapSettings.center}
          zoom={mapSettings.zoom}
          maxBounds={regionBounds}
          maxZoom={mapSettings.maxZoom}
          minZoom={mapSettings.minZoom}
          zoomControl={true}
          dragging={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          style={{ 
            width: "100%", 
            height: "100%",
            borderRadius: isMobile ? "0" : "0 20px 20px 0"
          }}
          key={`${windowSize.width}-${windowSize.height}`}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {regions.map((coords, i) => {
            let teamIndex;
            if (i < sortedTeamsWithTotals.length) {
              teamIndex = teams.findIndex(team => team.name === teams[i].name);
            } else {
              teamIndex = i % teams.length;
            }
            
            return (
              <Polygon
                key={i}
                positions={coords}
                pathOptions={{ 
                  color: teams[teamIndex].color, 
                  fillOpacity: 0.4,
                  weight: 3,
                  fillColor: teams[teamIndex].color
                }}
              />
            );
          })}
          
          {teams.map((team, i) =>
            team.buildings.map((b, j) => (
              <Marker
                key={i + '-' + j}
                position={[b.lat, b.lon]}
                icon={L.divIcon({
                  className: '',
                  html: `
                    <div style="
                      color: ${b.color};
                      font-weight: bold;
                      font-size: 20px;
                      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                      filter: drop-shadow(0 0 3px rgba(255,255,255,0.8));
                      transform: scale(1.2);
                    ">${getIconHtml(b)}</div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div style={{ textAlign: "center" }}>
                    <strong>{b.name}</strong><br/>
                    <span style={{ color: b.color }}>Team {teams.findIndex(t => t.color === b.color) + 1}</span>
                  </div>
                </Popup>
              </Marker>
            ))
          )}
        </MapContainer>
      </div>

      {/* Sidebar */}
      <div style={{ 
        width: isMobile ? "100%" : isTablet ? "320px" : "700px",
        minWidth: isMobile ? "100%" : "280px",
        height: isMobile ? "40vh" : "100vh",
        padding: isMobile ? "10px" : "20px",
        overflowY: "auto",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.2)",
        borderTop: isMobile ? "1px solid rgba(255,255,255,0.2)" : "none",
        position: "relative"
      }}>
        {/* Round indicator */}
        <div style={{
          textAlign: "center",
          marginBottom: isMobile ? "8px" : "12px",
          fontSize: isMobile ? "1rem" : "4rem",
          fontWeight: "bold",
          color: "#333",
          background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Round {round}
        </div>

        {/* Teams Display */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "1fr 1fr 1fr", // 修改為三列
            gap: isMobile ? "4px" : "6px",
            maxHeight: isMobile ? "calc(40vh - 60px)" : "calc(100vh - 80px)",
            overflowY: "auto",
            paddingRight: "4px"
          }}>
            <AnimatePresence>
              {sortedTeamsWithTotals.map((team, index) => (
                <motion.div
                  key={team.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05
                  }}
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
                    padding: isMobile ? "6px" : "8px", // 稍微減小內邊距以適應三列佈局
                    borderRadius: "8px",
                    boxShadow: `0 2px 6px ${team.color}20`,
                    border: `2px solid ${team.color}40`,
                    position: "relative",
                    overflow: "visible"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px" // 減少間距
                  }}>
                    <div style={{
                      width: "30px", // 稍微縮小圓點
                      height: "30px",
                      borderRadius: "50%",
                      background: team.color,
                      marginRight: "4px",
                      boxShadow: `0 0 4px ${team.color}50`
                    }}></div>
                    <h3 style={{ 
                      color: "#333", 
                      margin: 0,
                      fontSize: isMobile ? "0.7rem" : "2rem", // 調整字體大小
                      fontWeight: "600"
                    }}>
                      {team.name}
                    </h3>
                  </div>

                  <div style={{ background: "#eee", height: 20, marginBottom: 4 }}> {/* 縮小進度條 */}
                    <div
                      style={{
                        width: `${Math.min(team.points, 100)}%`,
                        background: team.color,
                        height: "100%"
                      }}
                    />
                  </div>

                  {/* Stats display */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "2px", // 減少間距
                    fontSize: isMobile ? "0.6rem" : "1rem" // 調整字體大小
                  }}>
                    <div style={{
                      background: "linear-gradient(135deg, #667eea20, #764ba220)",
                      padding: "1px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}>
                      <div style={{ color: "#666", fontWeight: "bold", fontSize: "2.5rem" }}>{team.points} Points</div>
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "2px"
                    }}>
                      <div style={{
                        background: "rgba(0,191,99,0.1)",
                        padding: "1px",
                        borderRadius: "4px",
                        textAlign: "center",
                        flex: 1
                      }}>
                        <div style={{ color: "#0a5f36ff", fontWeight: "bold", fontSize: "2.5rem" }}>💰 {team.totalIncome || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* 如果是第4個團隊（索引3），在右側顯示計時器 - 調整位置以適應三列佈局 */}
                  {index === 3 && !isMobile && (
                    <div style={{
                      position: "absolute",
                      top: "400px",
                      left: "459px",
                      marginLeft: "10px",
                      background: timeLeft <= 60 ? "linear-gradient(45deg, #FF6B6B, #FF8E8E)" : "linear-gradient(45deg, #03423eff, #44A08D)",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                      border: "2px solid rgba(255,255,255,0.3)",
                      zIndex: 1000,
                      minWidth: "200px",
                      minHeight: "150px",
                      whiteSpace: "nowrap"
                    }}>
                      <div style={{
                        fontSize: "4rem",
                        fontWeight: "bold",
                        color: "white",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        textAlign: "center",
                        marginTop: "40px"
                      }}>
                        {formatTime(timeLeft)}
                      </div>
                      
                      {timeLeft <= 60 && timeLeft > 0 && (
                        <div style={{
                          fontSize: "0.7rem",
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                          marginTop: "4px",
                          animation: "blink 1s infinite"
                        }}>
                        </div>
                      )}

                      {timeLeft === 0 && (
                        <div style={{
                          fontSize: "0.8rem",
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                          marginTop: "4px"
                        }}>
                          🔔 時間到！
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Compact Legend */}
        {!isMobile && (
          <div style={{
            padding: "10px",
            background: "rgba(248,249,250,0.8)",
            borderRadius: "8px",
            border: "1px solid #dee2e6"
          }}>
            <h3 style={{ 
              margin: "0 0 8px 0", 
              fontSize: "1.5rem",
              color: "#333"
            }}>
              🗺️ Legend
            </h3>
            <div style={{ fontSize: "1.5rem", lineHeight: "1.3" }}>
              <div>💰 Economy  ✈️ Airport</div>
            </div>
          </div>
        )}

        {/* CSS for animations */}
        <style>
          {`
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default MapPage;