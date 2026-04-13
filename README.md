# kbo-api

KBO(한국프로야구) 공식 사이트 비공식 API 클라이언트

경기 일정, 실시간 스코어, 이닝별 스코어보드, 수비 배치, 문자중계 데이터를 조회할 수 있습니다.

## 설치

```bash
npm install kbo-api
```

> Node.js 18 이상 필요 (native `fetch` 사용)

## 사용법

### 경기 목록 조회

```typescript
import { getGames } from "kbo-api";

// 오늘 경기
const games = await getGames(new Date());

// 특정 날짜 경기
const games = await getGames("20260412");

for (const g of games) {
  console.log(`${g.awayTeam} ${g.awayScore} vs ${g.homeScore} ${g.homeTeam}`);
}
```

### 실시간 경기 상태

```typescript
import { getGameState } from "kbo-api";

const state = await getGameState("20260412SKLG0");
if (state) {
  const half = state.inningHalf === "TOP" ? "초" : "말";
  console.log(`${state.inning}회 ${half} | B${state.balls} S${state.strikes} O${state.outs}`);
}
```

### 이닝별 스코어보드

```typescript
import { getScoreboard } from "kbo-api";

const board = await getScoreboard("20260412SKLG0");
if (board) {
  console.log(`${board.away.team}: ${board.away.innings.join(" ")} | R:${board.away.runs} H:${board.away.hits} E:${board.away.errors}`);
  console.log(`${board.home.team}: ${board.home.innings.join(" ")} | R:${board.home.runs} H:${board.home.hits} E:${board.home.errors}`);
}
```

### 그라운드 상태 (수비 배치, 주자, 타자)

```typescript
import { getGroundState } from "kbo-api";

const ground = await getGroundState("20260412SKLG0");

// 현재 타자
if (ground.currentHitter) {
  console.log(`타자: ${ground.currentHitter.name} (${ground.currentHitter.battingSide})`);
}

// 주자
for (const runner of ground.runners) {
  console.log(`${runner.position}루: ${runner.name}`);
}

// 수비
for (const defender of ground.defense) {
  console.log(`포지션 ${defender.position}: ${defender.name}`);
}
```

### 문자중계

```typescript
import { getLiveText, parseLiveTextHtml } from "kbo-api";

const html = await getLiveText("20260412SKLG0");
const lines = parseLiveTextHtml(html);

for (const line of lines) {
  console.log(line);
}
```

### 경기 결과 요약

```typescript
import { getGameResult } from "kbo-api";

const result = await getGameResult("20260412SKLG0");
for (const r of result) {
  console.log(r.text);
}
// 승리투수: 톨허스트
// 패전투수: 베니지아노
// 경기종료
```

## API

| 함수 | 설명 |
|---|---|
| `getGames(date, seriesId?)` | 특정 날짜 경기 목록 조회 |
| `getGameState(gameId, seriesId?)` | 실시간 경기 상태 (이닝, 카운트, 주자) |
| `getScoreboard(gameId, seriesId?)` | 이닝별 스코어보드 (R/H/E/B) |
| `getGroundState(gameId, seriesId?)` | 수비 배치, 주자, 현재/다음 타자 |
| `getGameResult(gameId, seriesId?)` | 경기 결과 요약 텍스트 |
| `getLiveText(gameId, season?, seriesId?)` | 문자중계 HTML 원본 |
| `parseLiveTextHtml(html)` | 문자중계 HTML → 텍스트 배열 파싱 |

## Game ID 형식

게임 ID는 `YYYYMMDD` + 원정팀코드 + 홈팀코드 + 인덱스 형식입니다.

예: `20260412SKLG0` = 2026년 4월 12일 SSG(SK) vs LG 첫 번째 경기

## 주의사항

- KBO 공식 사이트의 비공식 API를 사용합니다. API가 변경될 수 있습니다.
- 과도한 요청은 자제해 주세요.
- 상업적 용도로 사용 시 KBO 측의 데이터 이용 정책을 확인해 주세요.

## License

MIT
