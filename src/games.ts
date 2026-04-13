import { postDesktop, postMobile } from "./client.js";
import type {
  RawGame,
  Game,
  GameStatus,
  RawGameState,
  GameState,
  InningHalf,
} from "./types.js";

// ──────────────────────────────────────────────
// 경기 목록 조회
// ──────────────────────────────────────────────

function toDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function mapStatus(sc: string): GameStatus {
  switch (sc) {
    case "1": return "SCHEDULED";
    case "2": return "IN_PROGRESS";
    case "3": return "FINISHED";
    case "4": return "CANCELED";
    default:  return "SCHEDULED";
  }
}

function parseGame(raw: RawGame): Game {
  return {
    id: raw.G_ID,
    date: raw.G_DT,
    startTime: raw.G_TM,
    stadium: raw.S_NM,
    homeTeam: raw.HOME_NM,
    awayTeam: raw.AWAY_NM,
    homeScore: parseInt(raw.B_SCORE_CN) || 0,
    awayScore: parseInt(raw.T_SCORE_CN) || 0,
    status: mapStatus(raw.GAME_STATE_SC),
    currentInning: raw.GAME_INN_NO,
    homePitcher: raw.B_PIT_P_NM?.trim() ?? "",
    awayPitcher: raw.T_PIT_P_NM?.trim() ?? "",
    winPitcher: raw.W_PIT_P_NM?.trim() ?? "",
    losePitcher: raw.L_PIT_P_NM?.trim() ?? "",
    savePitcher: raw.SV_PIT_P_NM?.trim() ?? "",
    broadcast: raw.TV_IF ? raw.TV_IF.split(",").map((s) => s.trim()) : [],
    season: raw.SEASON_ID,
  };
}

/**
 * 특정 날짜의 KBO 경기 목록을 조회합니다.
 *
 * @param date - 조회할 날짜 (Date 객체 또는 'YYYYMMDD' 문자열)
 * @param seriesId - 시리즈 ID (기본: 전체)
 */
export async function getGames(
  date: Date | string,
  seriesId = "0,1,3,4,5,6,7,8,9",
): Promise<Game[]> {
  const dateStr = typeof date === "string" ? date : toDateString(date);

  const res = await postDesktop<{ game: RawGame[] }>(
    "/ws/Main.asmx/GetKboGameList",
    {
      leId: "1",
      srId: seriesId,
      date: dateStr,
    },
  );

  if (!res.game || res.game.length === 0) {
    return [];
  }

  return res.game.map(parseGame);
}

// ──────────────────────────────────────────────
// 경기 상태 조회
// ──────────────────────────────────────────────

function parseGameState(raw: RawGameState): GameState {
  return {
    gameId: raw.G_ID,
    stadium: raw.S_NM,
    homeTeam: raw.HOME_NM,
    awayTeam: raw.AWAY_NM,
    homeScore: raw.H_SCORE_CN,
    awayScore: raw.A_SCORE_CN,
    inning: raw.INN_NO,
    inningHalf: (raw.TB_SC === "T" ? "TOP" : "BOTTOM") as InningHalf,
    balls: raw.BALL_CN,
    strikes: raw.STRIKE_CN,
    outs: raw.OUT_CN,
    baseSituation: raw.BASE_SC,
    section: raw.SECTION_ID,
  };
}

/**
 * 특정 경기의 실시간 상태를 조회합니다.
 *
 * @param gameId - 경기 ID (예: '20260412SKLG0')
 * @param seriesId - 시리즈 ID (기본: '0')
 */
export async function getGameState(
  gameId: string,
  seriesId = "0",
): Promise<GameState | null> {
  const res = await postMobile<{ game: RawGameState[]; code: string }>(
    "/ws/Kbo.asmx/GetGameState",
    {
      le_id: "1",
      sr_id: seriesId,
      g_id: gameId,
    },
  );

  if (!res.game || res.game.length === 0) {
    return null;
  }

  return parseGameState(res.game[0]);
}
