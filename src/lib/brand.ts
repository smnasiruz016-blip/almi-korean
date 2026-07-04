// AlmiKorean brand tokens (TS mirror of globals.css @theme). Sunrise palette (inherited from
// the AlmiJapanese fork — kept per build command). Identity only differs.
export const BRAND = {
  coral: "#FF7A6B",
  coralDeep: "#F2624F",
  sun: "#F2A65A",
  sunDeep: "#DD8F3F",
  teal: "#0D9488",
  ink: "#14110D",
  text: "#3B352D",
  textMuted: "#6B6156",
  bg: "#FFFAF3",
  bgPeach: "#FFE9D8",
  paper: "#FFFFFF",
  onDark: "#FBF6EF",
  line: "#ECE3D6",
} as const;

export const PRODUCT = {
  name: "AlmiKorean",
  exam: "TOPIK",
  tracks: ["TOPIK_I", "TOPIK_II"] as const, // two separate registrations, not one ladder
  levels: [1, 2, 3, 4, 5, 6] as const, //      awarded by total; 1–2 via TOPIK I, 3–6 via TOPIK II
  domain: "almikorean.almiworld.com",
} as const;
