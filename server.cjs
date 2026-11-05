
const http = require('node:http');
const { getGames } = require('./dist/index.js');

const PORT = process.env.PORT || 3000;

// 검색 범위
const PAST_DAYS = 60;
const FUTURE_DAYS = 45;

// 서버 캐시: 30분
const CACHE_MS = 30 * 60 * 1000;
let cache = null;
let pendingRequest = null;

// 한국 시간 기준 오늘 날짜
function getToday() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const part = type =>
        parts.find(p => p.type === type).value;

    return part('year') + part('month') + part('day');
}

// 날짜에 일수 더하거나 빼기
function addDays(date, days) {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6)) - 1;
    const day = Number(date.slice(6, 8));

    const d = new Date(Date.UTC(year, month, day + days));

    return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// 삼성 라이온즈 경기 확인
function isSamsung(game) {
    return game.homeTeam === '삼성' ||
           game.awayTeam === '삼성';
}

// 날짜별 KBO 경기 조회
async function getSamsungGames(date) {
    const games = await getGames(date);
    return games.filter(isSamsung);
}

// 최근 종료 경기 검색
async function findRecentGame(today) {

    // 7일씩 병렬 조회하여 API 요청 부담 조절
    for (let start = 0; start <= PAST_DAYS; start += 7) {

        const offsets = [];

        for (let i = start; i < start + 7 && i <= PAST_DAYS; i++) {
            offsets.push(i);
        }

        const results = await Promise.all(
            offsets.map(async function(i) {
                const date = addDays(today, -i);
                const games = await getSamsungGames(date);

                return games
                    .filter(g => g.status === 'FINISHED')
                    .map(g => ({ ...g, date }));
            })
        );

        // 가까운 날짜부터 검색
        for (const dayGames of results) {
            if (dayGames.length > 0) {
                // 같은 날짜에 여러 경기라면 늦은 경기 선택
                dayGames.sort((a, b) =>
                    String(b.startTime).localeCompare(String(a.startTime))
                );
                return dayGames[0];
            }
        }
    }

    return null;
}

// 다음 예정 경기 검색
async function findNextGame(today) {

    for (let start = 0; start <= FUTURE_DAYS; start += 7) {

        const offsets = [];

        for (let i = start; i < start + 7 && i <= FUTURE_DAYS; i++) {
            offsets.push(i);
        }

        const results = await Promise.all(
            offsets.map(async function(i) {
                const date = addDays(today, i);
                const games = await getSamsungGames(date);

                return games
                    .filter(g => g.status === 'SCHEDULED')
                    .map(g => ({ ...g, date }));
            })
        );

        for (const dayGames of results) {
            if (dayGames.length > 0) {
                // 같은 날짜라면 빠른 경기 선택
                dayGames.sort((a, b) =>
                    String(a.startTime).localeCompare(String(b.startTime))
                );

                // 오늘 경기라면 이미 시작 시간이 지난 일정 제외
                if (dayGames[0].date === today) {
                    const nowTime = new Intl.DateTimeFormat('en-GB', {
                        timeZone: 'Asia/Seoul',
                        hour: '2-digit',
                        minute: '2-digit',
                        hourCycle: 'h23'
                    }).format(new Date());

                    const upcoming = dayGames.find(g => {
                        const t = String(g.startTime).match(/\d{1,2}:\d{2}/);
                        return t && t[0].padStart(5, '0') > nowTime;
                    });

                    if (upcoming) return upcoming;
                    continue;
                }

                return dayGames[0];
            }
        }
    }

    return null;
}

// 결과 조회 및 캐싱
async function loadLionsData() {

    const today = getToday();

    if (
        cache &&
        cache.date === today &&
        Date.now() - cache.time < CACHE_MS
    ) {
        return cache.data;
    }

    if (pendingRequest) return pendingRequest;

    pendingRequest = (async function() {

        const [result, next] = await Promise.all([
            findRecentGame(today),
            findNextGame(today)
        ]);

        const data = {
            today: today,
            result: result,
            next: next
        };

        cache = {
            date: today,
            time: Date.now(),
            data: data
        };

        return data;
    })();

    try {
        return await pendingRequest;
    } finally {
        pendingRequest = null;
    }
}

// 서버 생성
const server = http.createServer(async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname !== '/api/lions') {
        res.writeHead(404);
        return res.end(JSON.stringify({
            error: 'Not Found'
        }));
    }

    try {
        const data = await loadLionsData();

        res.writeHead(200);
        res.end(JSON.stringify(data));

    } catch (error) {
        console.error('KBO API 오류:', error);

        res.writeHead(502);
        res.end(JSON.stringify({
            error: '경기 데이터를 불러오지 못했습니다.'
        }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`KBO 서버 실행: ${PORT}`);
});
