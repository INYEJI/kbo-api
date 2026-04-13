import {
  getGames,
  getGameState,
  getScoreboard,
  getGroundState,
  getGameResult,
  getLiveText,
  parseLiveTextHtml,
} from "../src/index.js";

async function main() {
  // 1. 오늘 경기 목록 조회
  const today = new Date();
  const games = await getGames(today);

  if (games.length === 0) {
    console.log("오늘 경기가 없습니다.");

    // 날짜를 직접 지정해서 조회
    const pastGames = await getGames("20260412");
    console.log(`\n2026-04-12 경기 (${pastGames.length}경기):`);
    for (const g of pastGames) {
      console.log(`  ${g.awayTeam} ${g.awayScore} vs ${g.homeScore} ${g.homeTeam} (${g.stadium}) [${g.status}]`);
    }

    if (pastGames.length > 0) {
      await showGameDetail(pastGames[0].id);
    }
    return;
  }

  console.log(`오늘 경기 (${games.length}경기):`);
  for (const g of games) {
    console.log(`  ${g.awayTeam} ${g.awayScore} vs ${g.homeScore} ${g.homeTeam} (${g.stadium}) [${g.status}]`);
  }

  // 첫 번째 경기 상세 조회
  await showGameDetail(games[0].id);
}

async function showGameDetail(gameId: string) {
  console.log(`\n── 경기 상세: ${gameId} ──`);

  // 2. 경기 상태
  const state = await getGameState(gameId);
  if (state) {
    const half = state.inningHalf === "TOP" ? "초" : "말";
    console.log(`\n[경기 상태]`);
    console.log(`  ${state.awayTeam} ${state.awayScore} vs ${state.homeScore} ${state.homeTeam}`);
    console.log(`  ${state.inning}회 ${half} | B${state.balls} S${state.strikes} O${state.outs}`);
  }

  // 3. 이닝별 스코어보드
  const scoreboard = await getScoreboard(gameId);
  if (scoreboard) {
    console.log(`\n[스코어보드]`);
    const maxInnings = Math.max(scoreboard.away.innings.length, scoreboard.home.innings.length);
    const header = "     " + Array.from({ length: maxInnings }, (_, i) => String(i + 1).padStart(3)).join("") + "   R  H  E";
    console.log(header);
    const awayLine = scoreboard.away.team.padEnd(5) + scoreboard.away.innings.map((s) => (s ?? "-").toString().padStart(3)).join("");
    console.log(`${awayLine}  ${String(scoreboard.away.runs).padStart(2)} ${String(scoreboard.away.hits).padStart(2)} ${String(scoreboard.away.errors).padStart(2)}`);
    const homeLine = scoreboard.home.team.padEnd(5) + scoreboard.home.innings.map((s) => (s ?? "-").toString().padStart(3)).join("");
    console.log(`${homeLine}  ${String(scoreboard.home.runs).padStart(2)} ${String(scoreboard.home.hits).padStart(2)} ${String(scoreboard.home.errors).padStart(2)}`);
  }

  // 4. 그라운드 상태
  const ground = await getGroundState(gameId);
  if (ground.currentHitter) {
    console.log(`\n[현재 타자] ${ground.currentHitter.name} (${ground.currentHitter.battingSide})`);
  }
  if (ground.runners.length > 0) {
    console.log(`[주자] ${ground.runners.map((r) => `${r.position}루: ${r.name}`).join(", ")}`);
  }

  // 5. 경기 결과
  const result = await getGameResult(gameId);
  if (result.length > 0) {
    console.log(`\n[경기 결과]`);
    for (const r of result) {
      if (r.text !== "=====================================") {
        console.log(`  ${r.text}`);
      }
    }
  }

  // 6. 문자중계
  const liveHtml = await getLiveText(gameId);
  const liveLines = parseLiveTextHtml(liveHtml);
  if (liveLines.length > 0) {
    console.log(`\n[문자중계 (최근 10개)]`);
    for (const line of liveLines.slice(0, 10)) {
      console.log(`  ${line}`);
    }
  }
}

main().catch(console.error);
