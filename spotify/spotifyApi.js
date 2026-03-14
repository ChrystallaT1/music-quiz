import { getState, setState } from "../js/state.js";
import { isTokenExpired, refreshAccessToken } from "./authPkce.js";

const BASE_URL = "https://api.spotify.com";

// popularity ranges per difficulty
const DIFFICULTY_FILTER = {
  easy: (track) => track.popularity >= 70,
  medium: (track) => track.popularity >= 40 && track.popularity < 70,
  hard: (track) => track.popularity < 40,
};

// strips tracks with no preview, applies difficulty filter
function filterTracks(tracks, difficulty) {
  const withPreviews = tracks.filter((t) => t.preview_url !== null);
  const filterFn = DIFFICULTY_FILTER[difficulty];
  return filterFn ? withPreviews.filter(filterFn) : withPreviews;
}

//attaches auth header, handles 401/429/errors
async function apiRequest(endpoint, options = {}) {
  if (isTokenExpired()) {
    await refreshAccessToken();
  }

  const { accessToken } = getState();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    // refresh once and retry
    await refreshAccessToken();
    const { accessToken: newToken } = getState();
    const retried = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!retried.ok) throw new Error(`API error ${retried.status}`);
    return retried.json();
  }

  if (response.status === 429) {
    // wait Retry-After seconds, then retry
    const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return apiRequest(endpoint, options);
  }

  if (!response.ok) {
    throw new Error(
      `Spotify API error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

// search tracks by artist name, cache result in state
async function searchArtistTracks(artistName, difficulty) {
  const cacheKey = `artist:${artistName}:${difficulty}`;
  const { trackPool } = getState();
  if (trackPool?.cacheKey === cacheKey) return trackPool.tracks;

  const params = new URLSearchParams({
    q: artistName,
    type: "track",
    limit: "50",
  });

  const data = await apiRequest(`/v1/search?${params}`);
  const tracks = filterTracks(data.tracks.items, difficulty);

  setState({ trackPool: { cacheKey, tracks } });
  return tracks;
}

// fetch all available genre categories
async function fetchCategories() {
  const params = new URLSearchParams({ limit: "50" });
  const data = await apiRequest(`/v1/browse/categories?${params}`);
  return data.categories.items;
}

// fetch playlists for a genre category
async function fetchCategoryPlaylists(categoryId) {
  const data = await apiRequest(
    `/v1/browse/categories/${categoryId}/playlists`,
  );
  return data.playlists.items;
}

// fetch tracks from a playlist
async function fetchPlaylistTracks(playlistId) {
  const data = await apiRequest(`/v1/playlists/${playlistId}/tracks`);
  return data.items.map((item) => item.track).filter((track) => track !== null);
}

// build a genre track pool — walks playlists until 10+ playable tracks found
async function fetchGenreTracks(categoryId, difficulty) {
  const cacheKey = `genre:${categoryId}:${difficulty}`;
  const { trackPool } = getState();
  if (trackPool?.cacheKey === cacheKey) return trackPool.tracks;

  const playlists = await fetchCategoryPlaylists(categoryId);

  let tracks = [];
  for (const playlist of playlists) {
    const raw = await fetchPlaylistTracks(playlist.id);
    tracks = filterTracks(raw, difficulty);
    if (tracks.length >= 10) break;
  }

  setState({ trackPool: { cacheKey, tracks } });
  return tracks;
}

// search artists by name — used for autocomplete in pickArtistOrGenre
async function searchArtists(query) {
  const params = new URLSearchParams({ q: query, type: "artist", limit: "8" });
  const data = await apiRequest(`/v1/search?${params}`);
  return data.artists.items;
}

export {
  apiRequest,
  searchArtistTracks,
  searchArtists,
  fetchCategories,
  fetchCategoryPlaylists,
  fetchPlaylistTracks,
  fetchGenreTracks,
};
