const DESKTOP_BASE = "https://www.koreabaseball.com";
const MOBILE_BASE = "https://m.koreabaseball.com";

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Requested-With": "XMLHttpRequest",
};

export async function postDesktop<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = `${DESKTOP_BASE}${path}`;
  const body = new URLSearchParams(params);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      Origin: DESKTOP_BASE,
      Referer: `${DESKTOP_BASE}/Schedule/GameCenter/Main.aspx`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`KBO API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function postDesktopHtml(
  path: string,
  params: Record<string, string>,
): Promise<string> {
  const url = `${DESKTOP_BASE}${path}`;
  const body = new URLSearchParams(params);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      Origin: DESKTOP_BASE,
      Referer: `${DESKTOP_BASE}/Game/LiveText.aspx`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`KBO API error: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

export async function postMobile<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = `${MOBILE_BASE}${path}`;
  const body = new URLSearchParams(params);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      Referer: `${MOBILE_BASE}/`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`KBO API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
