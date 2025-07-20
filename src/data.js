export const teamColors = [
  "#808000", "#ff3131", "#ffde59", "#ff914d", "#00bf63",
  "#8c52ff", "#469990", "#7ed957", "#ff66c4", "#000075"
];

export const initialTeams = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: `Team ${i + 1}`,
  color: teamColors[i],
  points: 0,
  income: 0,
  buildings: []
}));
