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

// The trackPool  already filtered by difficulty, so picking a random unused track.
function pickByDifficulty(unused) {
  return pickRandom(unused);
}

// tracks already used as correct answers (stored in roundResults) are never reused.
function buildQuestion(trackPool, mode) {
  const { roundResults, difficulty } = getState();
  const usedIds = new Set(roundResults.map((r) => r.correctTrack.id));

  if (mode === "artist") {
    return buildArtistQuestion(trackPool, usedIds, difficulty);
  }
  return buildGenreQuestion(trackPool, usedIds, difficulty);
}

function buildArtistQuestion(trackPool, usedIds, difficulty) {
  const byArtist = {};
  for (const track of trackPool) {
    const artistName = track.artistName;
    if (!byArtist[artistName]) byArtist[artistName] = [];
    byArtist[artistName].push(track);
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
  const correctTrack = pickByDifficulty(unusedTracks, difficulty);

  // 3 decoys
  const usedNames = new Set([correctTrack.trackName?.toLowerCase().trim()]);
  const decoys = artistTracks
    .filter((t) => {
      if (t.id === correctTrack.id) return false;
      const key = t.trackName?.toLowerCase().trim();
      if (usedNames.has(key)) return false;
      usedNames.add(key);
      return true;
    })
    .slice(0, 3);

  const options = shuffle([correctTrack, ...decoys]);

  // record the correct track as used
  setState({ answerChoices: options, currentTrack: correctTrack });

  return { correctTrack, options };
}

// Genre mode: correct answer is any unused track; decoys come from different artists.
function buildGenreQuestion(trackPool, usedIds, difficulty) {
  const unused = trackPool.filter((t) => !usedIds.has(t.id));

  if (unused.length === 0) {
    throw new Error("No unused tracks left for a genre question.");
  }

  const correctTrack = pickByDifficulty(unused, difficulty);

  // decoys  on Hard, include same-artist tracks
  const usedNames = new Set([correctTrack.trackName?.toLowerCase().trim()]);
  function uniqueDecoy(t) {
    const key = t.trackName?.toLowerCase().trim();
    if (t.id === correctTrack.id || usedNames.has(key)) return false;
    usedNames.add(key);
    return true;
  }

  let decoys;
  if (difficulty === "hard") {
    const sameArtist = shuffle(
      trackPool.filter(
        (t) => t.artistName === correctTrack.artistName && uniqueDecoy(t),
      ),
    ).slice(0, 2);
    const otherArtist = shuffle(
      trackPool.filter(
        (t) => t.artistName !== correctTrack.artistName && uniqueDecoy(t),
      ),
    ).slice(0, 3 - sameArtist.length);
    decoys = shuffle([...sameArtist, ...otherArtist]);
  } else {
    const decoyPool = shuffle(
      trackPool.filter(
        (t) => t.artistName !== correctTrack.artistName && uniqueDecoy(t),
      ),
    );
    if (decoyPool.length < 3) {
      throw new Error("Not enough tracks from different artists for decoys.");
    }
    decoys = decoyPool.slice(0, 3);
  }
  const options = shuffle([correctTrack, ...decoys]);

  setState({ answerChoices: options, currentTrack: correctTrack });

  return { correctTrack, options };
}

export { buildQuestion };
