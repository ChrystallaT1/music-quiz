const state = {
  // Game settings
  mode: null, // 'artist' | 'genre'
  difficulty: null, // 'easy' | 'medium' | 'hard'
  rounds: null, // 5 | 10 | 15
  previewLength: null, // seconds: 5 | 10 | 15 | 30
  artistOrGenre: null, // artist name/id or genre category id

  // Active game
  currentRound: 0,
  score: 0,
  trackPool: [],
  currentTrack: null,
  answerChoices: [],
  roundResults: [],
};

function setState(updates) {
  Object.assign(state, updates);
}

function resetGameState() {
  Object.assign(state, {
    mode: null,
    difficulty: null,
    rounds: null,
    previewLength: null,
    artistOrGenre: null,
    currentRound: 0,
    score: 0,
    trackPool: [],
    currentTrack: null,
    answerChoices: [],
    roundResults: [],
  });
}

// returns shallow copy of current
function getState() {
  return { ...state };
}

export { state, setState, resetGameState, getState };
