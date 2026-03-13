import { getState, setState } from "../js/state.js";

// returns a shuffled copy of an array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// tracks already used as correct answers (stored in roundResults) are never reused.
function buildQuestion(trackPool, mode) {
  const { roundResults } = getState();
  const usedIds = new Set(roundResults.map((r) => r.correctTrack.id));

  if (mode === "artist") {
    return buildArtistQuestion(trackPool, usedIds);
  }
  return buildGenreQuestion(trackPool, usedIds);
}

// picks a random artist that has enough unused tracks, then selects 1 correct + 3 decoys.
function buildArtistQuestion(trackPool, usedIds) {
  // group tracks by artist id
  const byArtist = {};
  for (const track of trackPool) {
    const artistId = track.artists[0].id;
    if (!byArtist[artistId]) byArtist[artistId] = [];
    byArtist[artistId].push(track);
  }

  // keep only artists with ≥4 tracks, at least one of which is unused
  const eligible = Object.values(byArtist).filter((tracks) => {
    const unused = tracks.filter((t) => !usedIds.has(t.id));
    return unused.length >= 1 && tracks.length >= 4;
  });

  if (eligible.length === 0) {
    throw new Error("Not enough tracks to build an artist question.");
  }

  const artistTracks = shuffle(
    eligible[Math.floor(Math.random() * eligible.length)],
  );
  const unusedTracks = artistTracks.filter((t) => !usedIds.has(t.id));
  const correctTrack = pickRandom(unusedTracks);

  // 3 decoys
  const decoys = artistTracks
    .filter((t) => t.id !== correctTrack.id)
    .slice(0, 3);

  const options = shuffle([correctTrack, ...decoys]);

  // record the correct track as used
  setState({ answerChoices: options, currentTrack: correctTrack });

  return { correctTrack, options };
}

// Genre mode: correct answer is any unused track; decoys come from different artists.
function buildGenreQuestion(trackPool, usedIds) {
  const unused = trackPool.filter((t) => !usedIds.has(t.id));

  if (unused.length === 0) {
    throw new Error("No unused tracks left for a genre question.");
  }

  const correctTrack = pickRandom(unused);

  // decoys
  const decoyPool = trackPool.filter(
    (t) =>
      t.id !== correctTrack.id &&
      t.artists[0].id !== correctTrack.artists[0].id,
  );

  if (decoyPool.length < 3) {
    throw new Error("Not enough tracks from different artists for decoys.");
  }

  const decoys = shuffle(decoyPool).slice(0, 3);
  const options = shuffle([correctTrack, ...decoys]);

  setState({ answerChoices: options, currentTrack: correctTrack });

  return { correctTrack, options };
}

export { buildQuestion };
