import { setState, getState } from "../js/state.js";

// Spotify app configuration — IDs, URLs, and permission scopes
const CONFIG = {
  CLIENT_ID: "4d4c34f7f5464f7f8edb318fbab073d9",

  REDIRECT_URI: "http://127.0.0.1:5500/callback",

  SPOTIFY_AUTH_URL: "https://accounts.spotify.com/authorize",
  SPOTIFY_TOKEN_URL: "https://accounts.spotify.com/api/token",

  SCOPE: "user-read-private user-read-email",
};

// Generates a random string of the given length — used as the PKCE code verifier
function generateRandomString(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Hashes the verifier with SHA-256 and base64url-encodes it to produce the code challenge
async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Builds the Spotify authorisation URL with all required PKCE query parameters
function buildAuthUrl(codeChallenge) {
  const params = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: "code",
    redirect_uri: CONFIG.REDIRECT_URI,
    scope: CONFIG.SCOPE,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${CONFIG.SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Generates verifier/challenge, saves verifier to localStorage, then redirects to Spotify login
async function redirectToSpotify() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("pkce_verifier", verifier);
  window.location.href = buildAuthUrl(challenge);
}

// Reads the callback URL and extracts the auth code (or error) from the query string
function extractCallbackParams() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  return { code, error };
}

// POSTs the auth code + stored verifier to Spotify's token endpoint and returns the tokens
async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem("pkce_verifier");

  const body = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: CONFIG.REDIRECT_URI,
    code_verifier: verifier,
  });

  const response = await fetch(CONFIG.SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Token exchange failed: ${err.error} — ${err.error_description}`,
    );
  }

  localStorage.removeItem("pkce_verifier");
  return await response.json();
}

// Saves access token, refresh token, and expiry timestamp into state
function storeTokens(tokenData) {
  setState({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenExpiry: Date.now() + tokenData.expires_in * 1000,
  });
}

// Returns true if the access token is missing or within 30 seconds of expiry
function isTokenExpired() {
  const { tokenExpiry } = getState();
  if (!tokenExpiry) return true;
  return Date.now() > tokenExpiry - 30_000;
}

// Uses the refresh token to silently get a new access token; logs out if it fails
async function refreshAccessToken() {
  const { refreshToken } = getState();

  if (!refreshToken) {
    logout();
    return;
  }

  const body = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(CONFIG.SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  if (!response.ok) {
    logout();
    return;
  }

  const tokenData = await response.json();
  storeTokens(tokenData);
}

// Clears all tokens from state and redirects to the landing page
function logout() {
  setState({
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
  });
  localStorage.removeItem("pkce_verifier");
  window.location.href = "/";
}

// Converts a Spotify auth error code into a user-friendly message and displays it
function handleAuthError(error) {
  let message;
  switch (error) {
    case "access_denied":
      message =
        "You declined the Spotify permissions. Please try again and accept to use the app.";
      break;
    case "invalid_client":
      message = "Invalid app configuration. Please contact support.";
      break;
    default:
      message = `Authentication failed: ${error}. Please try again.`;
  }
  const errorEl = document.getElementById("auth-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    alert(message);
  }
}

export {
  CONFIG,
  generateRandomString,
  generateCodeChallenge,
  buildAuthUrl,
  redirectToSpotify,
  extractCallbackParams,
  exchangeCodeForToken,
  storeTokens,
  isTokenExpired,
  refreshAccessToken,
  logout,
  handleAuthError,
};
