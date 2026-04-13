import { postDesktop, postMobile, postDesktopHtml } from "./client.js";
import type {
  RawLiveTextScore,
  RawScoreTable,
  Scoreboard,
  RawLiveTextGround,
  GroundState,
  RawLiveTextResult,
  LiveTextEntry,
  RawBoxScore,
  RawBoxScoreTable,
  BoxScore,
  BatterRecord,
  PitcherRecord,
} from "./types.js";

// ──────────────────────────────────────────────
// 이닝별 스코어보드
// ──────────────────────────────────────────────

function parseScoreTable(json: string): RawScoreTable {
  return JSON.parse(json) as RawScoreTable;
}

function extractTeamName(html: string): string {
  // "<span class='emb'>...</span>SSG" → "SSG"
  const match = html.match(/>([^<]+)$/);
  return match ? match[1].trim() : html.replace(/<[^>]+>/g, "").trim();
}

function parseInningScore(text: string): number | null {
  if (text === "-" || text === "") return null;
  return parseInt(text, 10);
}

/**
 * 이닝별 스코어보드를 조회합니다.
 *
 * @param gameId - 경기 ID
 * @param seriesId - 시리즈 ID (기본: '0')
 */
export async function getScoreboard(
  gameId: string,
  seriesId = "0",
): Promise<Scoreboard | null> {
  const res = await postMobile<RawLiveTextScore>(
    "/ws/Kbo.asmx/GetLiveTextScore",
    {
      le_id: "1",
      sr_id: seriesId,
      g_id: gameId,
      sc_id: "0",
    },
  );

  if (res.code !== "100") return null;

  const teamTable = parseScoreTable(res.teamTable);
  const scoreTable = parseScoreTable(res.scoreTable);
  const resultTable = parseScoreTable(res.resultTable);

  const awayName = teamTable.rows[0]
    ? extractTeamName(teamTable.rows[0].row[0].Text)
    : "";
  const homeName = teamTable.rows[1]
    ? extractTeamName(teamTable.rows[1].row[0].Text)
    : "";

  const awayInnings = scoreTable.rows[0]?.row.map((c) => parseInningScore(c.Text)) ?? [];
  const homeInnings = scoreTable.rows[1]?.row.map((c) => parseInningScore(c.Text)) ?? [];

  // resultTable: [R, H, E, B] for each team
  const awayResult = resultTable.rows[0]?.row.map((c) => parseInt(c.Text, 10) || 0) ?? [0, 0, 0, 0];
  const homeResult = resultTable.rows[1]?.row.map((c) => parseInt(c.Text, 10) || 0) ?? [0, 0, 0, 0];

  return {
    away: {
      team: awayName,
      innings: awayInnings,
      runs: awayResult[0],
      hits: awayResult[1],
      errors: awayResult[2],
      balls: awayResult[3],
    },
    home: {
      team: homeName,
      innings: homeInnings,
      runs: homeResult[0],
      hits: homeResult[1],
      errors: homeResult[2],
      balls: homeResult[3],
    },
    isExtra: res.extraCk,
  };
}

// ──────────────────────────────────────────────
// 그라운드 상태 (수비배치, 주자, 타자)
// ──────────────────────────────────────────────

/**
 * 현재 그라운드 상태를 조회합니다. (수비 배치, 주자, 현재/다음 타자)
 *
 * @param gameId - 경기 ID
 * @param seriesId - 시리즈 ID (기본: '0')
 */
export async function getGroundState(
  gameId: string,
  seriesId = "0",
): Promise<GroundState> {
  const res = await postMobile<RawLiveTextGround>(
    "/ws/Kbo.asmx/GetLiveTextGround",
    {
      le_id: "1",
      sr_id: seriesId,
      g_id: gameId,
    },
  );

  return {
    defense: (res.listDefense ?? []).map((p) => ({
      position: parseInt(p.POS_SC, 10),
      playerId: p.P_ID,
      name: p.P_NM,
    })),
    runners: (res.listRunner ?? []).map((p) => ({
      position: parseInt(p.POS_SC, 10),
      playerId: p.P_ID,
      name: p.P_NM,
    })),
    currentHitter:
      res.listHitter?.[0]
        ? {
            playerId: res.listHitter[0].P_ID,
            name: res.listHitter[0].P_NM,
            battingSide: res.listHitter[0].HIT_DIREC_SC,
          }
        : null,
    nextHitters: (res.listNextHitter ?? []).map((h) => ({
      order: parseInt(h.BAT_ORDER_NO, 10),
      playerId: h.P_ID,
      name: h.P_NM,
    })),
  };
}

// ──────────────────────────────────────────────
// 경기 결과 요약
// ──────────────────────────────────────────────

/**
 * 경기 결과 요약 텍스트를 조회합니다. (승리/패전/세이브 투수 등)
 *
 * @param gameId - 경기 ID
 * @param seriesId - 시리즈 ID (기본: '0')
 */
export async function getGameResult(
  gameId: string,
  seriesId = "0",
): Promise<LiveTextEntry[]> {
  const res = await postMobile<RawLiveTextResult>(
    "/ws/Kbo.asmx/GetLiveTextResult",
    {
      le_id: "1",
      sr_id: seriesId,
      g_id: gameId,
    },
  );

  if (res.code !== "100" || !res.listResult) return [];

  return res.listResult.map((item) => ({
    text: item.LIVETEXT_IF,
    style: item.TEXTSTYLE_SC,
  }));
}

// ──────────────────────────────────────────────
// 문자중계 (데스크톱 HTML → 파싱)
// ──────────────────────────────────────────────

export type LiveTextType = "play" | "inning" | "info";

export interface LiveTextLine {
  type: LiveTextType;
  text: string;
}

/**
 * 문자중계 HTML 원본을 조회합니다.
 *
 * @param gameId - 경기 ID
 * @param season - 시즌 연도 (예: '2026')
 * @param seriesId - 시리즈 ID (기본: '0')
 */
export async function getLiveText(
  gameId: string,
  season?: string,
  seriesId = "0",
): Promise<string> {
  const gyear = season ?? gameId.substring(0, 4);

  const html = await postDesktopHtml(
    "/Game/LiveTextView2.aspx",
    {
      leagueId: "1",
      seriesId,
      gameId,
      gyear,
    },
  );

  return html;
}

function classifyTextType(cssClass: string, text: string): LiveTextType {
  // Inning headers match patterns like "1회초", "9회말", "1회 상", "연장 10회말" etc.
  if (
    (cssClass.includes("blue") || cssClass.includes("red")) &&
    /(\d+회\s*(초|말|상|하)|\d+회.+공격)/.test(text)
  ) return "inning";
  if (cssClass.includes("info") || cssClass.includes("etc")) return "info";
  return "play";
}

/**
 * 문자중계 HTML을 파싱하여 구조화된 배열로 반환합니다.
 * 이닝 전환, 투구/타격 결과 등을 순서대로 반환합니다.
 *
 * @param html - getLiveText()로 받은 HTML 문자열
 */
export function parseLiveTextHtml(html: string): LiveTextLine[] {
  const lines: LiveTextLine[] = [];

  const regex = /spanLiveText[^>]*class="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/span>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const cssClass = match[1];
    const raw = match[2]
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[-]{5,}/g, "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(" ");

    if (raw.length === 0 || raw === "-") continue;

    lines.push({
      type: classifyTextType(cssClass, raw),
      text: raw,
    });
  }

  return lines;
}

// ──────────────────────────────────────────────
// 박스스코어 (선수 기록)
// ──────────────────────────────────────────────

function extractText(cell: { Text: string }): string {
  const t = cell.Text.replace(/&nbsp;/g, "").trim();
  return t;
}

function parseBatters(
  table1Json: string,
  table3Json: string,
): BatterRecord[] {
  const t1: RawBoxScoreTable = JSON.parse(table1Json);
  const t3: RawBoxScoreTable = JSON.parse(table3Json);
  const batters: BatterRecord[] = [];

  for (let i = 0; i < t1.rows.length; i++) {
    const r1 = t1.rows[i].row;
    const r3 = t3.rows[i]?.row;
    if (!r3) continue;

    batters.push({
      order: parseInt(extractText(r1[0])) || 0,
      position: extractText(r1[1]),
      name: extractText(r1[2]),
      atBats: parseInt(extractText(r3[0])) || 0,
      hits: parseInt(extractText(r3[1])) || 0,
      rbi: parseInt(extractText(r3[2])) || 0,
      runs: parseInt(extractText(r3[3])) || 0,
      average: extractText(r3[4]),
    });
  }

  return batters;
}

function parsePitchers(tableJson: string): PitcherRecord[] {
  const t: RawBoxScoreTable = JSON.parse(tableJson);
  return t.rows.map((r) => {
    const c = r.row.map((cell) => extractText(cell));
    return {
      name: c[0],
      role: c[1],
      result: c[2],
      wins: parseInt(c[3]) || 0,
      losses: parseInt(c[4]) || 0,
      saves: parseInt(c[5]) || 0,
      innings: c[6],
      batters: parseInt(c[7]) || 0,
      pitches: parseInt(c[8]) || 0,
      atBats: parseInt(c[9]) || 0,
      hitsAllowed: parseInt(c[10]) || 0,
      homeRuns: parseInt(c[11]) || 0,
      walks: parseInt(c[12]) || 0,
      strikeouts: parseInt(c[13]) || 0,
      earnedRuns: parseInt(c[14]) || 0,
      selfEarnedRuns: parseInt(c[15]) || 0,
      era: c[16],
    };
  });
}

/**
 * 경기 박스스코어 (타자/투수 기록)를 가져옵니다.
 *
 * @param gameId - 경기 ID (예: "20250413OBLG0")
 * @param seriesId - 시리즈 ID (기본 "0")
 */
export async function getBoxScore(
  gameId: string,
  seriesId = "0",
): Promise<BoxScore> {
  const gyear = gameId.slice(0, 4);

  const data = await postDesktop<RawBoxScore>(
    "/ws/Schedule.asmx/GetBoxScoreScroll",
    {
      leId: "1",
      srId: seriesId,
      seasonId: gyear,
      gameId,
    },
  );

  if (data.code !== "100") {
    throw new Error(`GetBoxScoreScroll failed: ${data.msg}`);
  }

  return {
    away: {
      batters: parseBatters(data.arrHitter[0].table1, data.arrHitter[0].table3),
      pitchers: parsePitchers(data.arrPitcher[0].table),
    },
    home: {
      batters: parseBatters(data.arrHitter[1].table1, data.arrHitter[1].table3),
      pitchers: parsePitchers(data.arrPitcher[1].table),
    },
  };
}
