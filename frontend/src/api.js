const API_BASE = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "gearledger_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const { body: rawBody, headers: optHeaders, ...rest } = options;
  const headers = {
    Accept: "application/json",
    ...optHeaders,
  };

  let body;
  if (rawBody !== undefined) {
    if (rawBody instanceof FormData) {
      body = rawBody;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(rawBody);
    }
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
