import { getState, setState } from "../js/state.js";

// userPick is the track object the player selected
function recordAnswer(isCorrect, timeTaken, userPick = null) {
  const { currentTrack, roundResults, score } = getState();

  const result = {
    correctTrack: currentTrack,
    userPick,
    isCorrect,
    timeTaken,
  };

  setState({
    roundResults: [...roundResults, result],
    score: isCorrect ? score + 1 : score,
  });
}

//return score
function getFinalScore() {
  const { score, roundResults } = getState();
  return { correct: score, total: roundResults.length };
}

// returns array of per-round objects for the results screen.
function getRoundResults() {
  return getState().roundResults.map((r, i) => ({
    round: i + 1,
    trackName: r.correctTrack?.trackName ?? "Unknown",
    correctAnswer: r.correctTrack?.artistName ?? "Unknown",
    userPick: r.userPick?.trackName ?? null,
    isCorrect: r.isCorrect,
    timeTaken: r.timeTaken,
  }));
}

function resetScores() {
  setState({ score: 0, roundResults: [] });
}

export { recordAnswer, getFinalScore, getRoundResults, resetScores };
