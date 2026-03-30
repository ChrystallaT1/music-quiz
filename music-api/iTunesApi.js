// iTunes Search API - public, no auth needed

const BASE_URL = "https://itunes.apple.com/search";

async function apiRequest(params) {
  try {
    const url = new URL(BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `iTunes API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("iTunes API request failed:", error);
    throw error;
  }
}

// Standardize iTunes track object structure
function normalizeTrack(itunesTrack) {
  return {
    id: itunesTrack.trackId,
    trackName: itunesTrack.trackName,
    artistName: itunesTrack.artistName,
    previewUrl: itunesTrack.previewUrl,
    artworkUrl: itunesTrack.artworkUrl100 || itunesTrack.artworkUrl60,
    collectionName: itunesTrack.collectionName,
    trackViewUrl: itunesTrack.trackViewUrl,
  };
}

// Only keep tracks with preview URLs
function filterTracksWithPreviews(tracks) {
  return tracks.filter((track) => {
    if (!track.previewUrl) return false;
    if (typeof track.previewUrl !== "string" || track.previewUrl.length === 0) {
      return false;
    }
    return true;
  });
}

async function searchArtists(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const results = await apiRequest({
      term: query,
      media: "music",
      entity: "allArtist",
      limit: 50,
    });

    // Remove duplicate artists
    const artists = results.reduce((unique, result) => {
      const exists = unique.some((a) => a.artistName === result.artistName);
      if (!exists && result.artistName) {
        unique.push({
          id: result.artistId,
          name: result.artistName,
          url: result.artistLinkUrl,
        });
      }
      return unique;
    }, []);

    return artists;
  } catch (error) {
    console.error("Failed to search artists:", error);
    throw error;
  }
}

async function searchArtistTracks(artistName) {
  if (!artistName || artistName.trim().length === 0) {
    return [];
  }

  try {
    const results = await apiRequest({
      term: artistName,
      media: "music",
      entity: "song",
      limit: 200,
    });

    // Normalize and filter tracks
    const tracks = filterTracksWithPreviews(results.map(normalizeTrack));

    return tracks;
  } catch (error) {
    console.error(`Failed to fetch tracks for artist "${artistName}":`, error);
    throw error;
  }
}

async function fetchGenreTracks(genreName) {
  if (!genreName || genreName.trim().length === 0) {
    return [];
  }

  try {
    const results = await apiRequest({
      term: genreName,
      media: "music",
      entity: "song",
      limit: 200,
    });

    // Normalize and filter tracks
    const tracks = filterTracksWithPreviews(results.map(normalizeTrack));

    return tracks;
  } catch (error) {
    console.error(`Failed to fetch tracks for genre "${genreName}":`, error);
    throw error;
  }
}

export { searchArtists, searchArtistTracks, fetchGenreTracks };
