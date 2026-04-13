// ──────────────────────────────────────────────
// 경기 목록 (GetKboGameList)
// ──────────────────────────────────────────────

export interface RawGame {
  LE_ID: number;
  SR_ID: number;
  SEASON_ID: number;
  G_DT: string;
  G_DT_TXT: string;
  G_ID: string;
  HEADER_NO: number;
  G_TM: string;
  S_NM: string;
  AWAY_ID: string;
  HOME_ID: string;
  AWAY_NM: string;
  HOME_NM: string;
  T_PIT_P_ID: number | null;
  T_PIT_P_NM: string;
  B_PIT_P_ID: number | null;
  B_PIT_P_NM: string;
  W_PIT_P_ID: number | null;
  W_PIT_P_NM: string;
  SV_PIT_P_ID: number | null;
  SV_PIT_P_NM: string;
  L_PIT_P_ID: number | null;
  L_PIT_P_NM: string;
  GAME_STATE_SC: string;
  CANCEL_SC_ID: string;
  CANCEL_SC_NM: string;
  GAME_INN_NO: number;
  T_SCORE_CN: string;
  B_SCORE_CN: string;
  TV_IF: string;
  STRIKE_CN: number;
  BALL_CN: number;
  OUT_CN: number;
}

export type GameStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELED";

export interface Game {
  id: string;
  date: string;
  startTime: string;
  stadium: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
  currentInning: number;
  homePitcher: string;
  awayPitcher: string;
  winPitcher: string;
  losePitcher: string;
  savePitcher: string;
  broadcast: string[];
  season: number;
}

// ──────────────────────────────────────────────
// 경기 상태 (GetGameState)
// ──────────────────────────────────────────────

export interface RawGameState {
  LE_ID: number;
  SR_ID: number;
  SEASON_ID: number;
  G_DT: string;
  G_ID: string;
  HEADER_NO: number;
  G_TM: string;
  S_ID: string;
  S_NM: string;
  AWAY_ID: string;
  HOME_ID: string;
  AWAY_NM: string;
  HOME_NM: string;
  STRIKE_CN: number;
  BALL_CN: number;
  OUT_CN: number;
  BASE_SC: number;
  INN_NO: number;
  TB_SC: string;
  TB_NM: string;
  SECTION_ID: number;
  H_SCORE_CN: number;
  A_SCORE_CN: number;
}

export type InningHalf = "TOP" | "BOTTOM";

export interface GameState {
  gameId: string;
  stadium: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  inning: number;
  inningHalf: InningHalf;
  balls: number;
  strikes: number;
  outs: number;
  baseSituation: number;
  /** SECTION_ID: 1=경기전, 2=경기중, 3=경기종료 */
  section: number;
}

// ──────────────────────────────────────────────
// 이닝별 스코어보드 (GetLiveTextScore)
// ──────────────────────────────────────────────

interface TableCell {
  Text: string;
  Class: string | null;
}

interface TableRow {
  row: TableCell[];
  Class: string | null;
}

export interface RawScoreTable {
  colgroup: unknown[];
  headers: unknown[];
  rows: TableRow[];
  tfoot: unknown[];
}

export interface RawLiveTextScore {
  teamTable: string;   // JSON string
  scoreTable: string;  // JSON string
  resultTable: string; // JSON string
  extraCk: boolean;
  code: string;
  msg: string;
}

export interface Scoreboard {
  away: {
    team: string;
    innings: (number | null)[];
    runs: number;
    hits: number;
    errors: number;
    balls: number;
  };
  home: {
    team: string;
    innings: (number | null)[];
    runs: number;
    hits: number;
    errors: number;
    balls: number;
  };
  isExtra: boolean;
}

// ──────────────────────────────────────────────
// 그라운드 상태 (GetLiveTextGround)
// ──────────────────────────────────────────────

export interface RawFieldPlayer {
  POS_SC: string;
  P_ID: string;
  P_NM: string;
}

export interface RawHitter {
  HIT_DIREC_SC: string;
  P_ID: string;
  P_NM: string;
}

export interface RawNextHitter {
  BAT_ORDER_NO: string;
  P_ID: string;
  P_NM: string;
}

export interface RawLiveTextGround {
  listDefense: RawFieldPlayer[];
  listRunner: RawFieldPlayer[];
  listHitter: RawHitter[];
  listNextHitter: RawNextHitter[];
}

export interface FieldPlayer {
  position: number;
  playerId: string;
  name: string;
}

export interface GroundState {
  defense: FieldPlayer[];
  runners: FieldPlayer[];
  currentHitter: {
    playerId: string;
    name: string;
    battingSide: string;
  } | null;
  nextHitters: {
    order: number;
    playerId: string;
    name: string;
  }[];
}

// ──────────────────────────────────────────────
// 문자중계 결과 (GetLiveTextResult)
// ──────────────────────────────────────────────

export interface RawLiveTextResultItem {
  LIVETEXT_IF: string;
  TEXTSTYLE_SC: string;
}

export interface RawLiveTextResult {
  listResult: RawLiveTextResultItem[];
  code: string;
  msg: string;
}

// ──────────────────────────────────────────────
// 문자중계 텍스트 (GetLiveText)
// ──────────────────────────────────────────────

export interface RawLiveTextItem {
  LIVETEXT_IF: string;
  TEXTSTYLE_SC: string;
}

export interface RawLiveText {
  list: RawLiveTextItem[];
  code: string;
  msg: string;
}

export interface LiveTextEntry {
  text: string;
  style: string;
}

// ──────────────────────────────────────────────
// 박스스코어 (GetBoxScoreScroll)
// ──────────────────────────────────────────────

export interface RawBoxScoreTableCell {
  Text: string;
  Class: string | null;
  RowSpan: string | null;
}

export interface RawBoxScoreTableRow {
  row: RawBoxScoreTableCell[];
  Class: string | null;
}

export interface RawBoxScoreTable {
  rows: RawBoxScoreTableRow[];
  tfoot?: RawBoxScoreTableRow[];
  headers?: RawBoxScoreTableRow[];
}

export interface RawBoxScore {
  tableEtc: string;       // JSON string
  arrHitter: { table1: string; table2: string; table3: string }[];
  arrPitcher: { table: string }[];
  realMaxInning: number;
  code: string;
  msg: string;
}

export interface BatterRecord {
  order: number;
  position: string;
  name: string;
  atBats: number;
  hits: number;
  rbi: number;
  runs: number;
  average: string;
}

export interface PitcherRecord {
  name: string;
  role: string;
  result: string;
  wins: number;
  losses: number;
  saves: number;
  innings: string;
  batters: number;
  pitches: number;
  atBats: number;
  hitsAllowed: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  earnedRuns: number;
  selfEarnedRuns: number;
  era: string;
}

export interface BoxScore {
  away: {
    batters: BatterRecord[];
    pitchers: PitcherRecord[];
  };
  home: {
    batters: BatterRecord[];
    pitchers: PitcherRecord[];
  };
}

// ──────────────────────────────────────────────
// 공통
// ──────────────────────────────────────────────

export interface KboApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}
