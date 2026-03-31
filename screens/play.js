import { getState, setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";
import { buildQuestion } from "../game/questionBuilder.js";
import { recordAnswer } from "../game/scoring.js";
import {
  mount,
  loadPreview,
  playPreview,
  stopPreview,
  resetPlayer,
} from "../js/audioPlayer.js";

function init() {
  setState({ currentRound: 0, score: 0, roundResults: [] });

  const el = document.querySelector('[data-screen="play"]');

  el.innerHTML = `
    <div class="screen-container play-container">

      <div class="play-header">
        <span id="round-counter" class="play-round">Round 1</span>
        <span id="score-display" class="play-score">Score: 0</span>
      </div>

      <div id="audio-mount"></div>

      <div id="answer-grid" class="answer-grid"></div>

      <div id="track-reveal" class="track-reveal" hidden>
        <img id="reveal-art" class="reveal-art" src="" alt="Album art" />
        <div class="reveal-info">
          <p id="reveal-track" class="reveal-track-name"></p>
          <p id="reveal-artist" class="reveal-artist-name"></p>
        </div>
      </div>

      <p id="play-error" class="error-msg" hidden></p>

    </div>
  `;

  mount(el.querySelector("#audio-mount"));
  startRound(el);
}

// Round lifecycle

function startRound(el) {
  const { rounds, trackPool, mode, previewLength } = getState();
  const nextRound = getState().currentRound + 1;
  setState({ currentRound: nextRound });

  el.querySelector("#round-counter").textContent =
    `Round ${nextRound} of ${rounds}`;
  el.querySelector("#score-display").textContent = `Score: ${getState().score}`;
  el.querySelector("#track-reveal").hidden = true;
  el.querySelector("#play-error").hidden = true;
  resetPlayer();

  let question;
  try {
    question = buildQuestion(trackPool, mode);
  } catch {
    showError(el, "Not enough tracks to continue — the game is ending now.");
    setTimeout(() => navigate(SCREENS.RESULTS), 3000);
    return;
  }

  const { correctTrack, options } = question;

  renderAnswerButtons(el, options, correctTrack, mode);

  loadPreview(correctTrack.previewUrl);
  playPreview(previewLength);
}

//  Answer buttons

function renderAnswerButtons(el, options, correctTrack, mode) {
  const grid = el.querySelector("#answer-grid");
  grid.innerHTML = "";
  const startTime = Date.now();

  options.forEach((track) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.dataset.trackId = track.id;
    btn.textContent = mode === "artist" ? track.trackName : track.artistName;

    btn.addEventListener("click", () =>
      handleAnswer(el, track, correctTrack, startTime),
    );
    grid.appendChild(btn);
  });
}

//  Answer handling

function handleAnswer(el, selectedTrack, correctTrack, startTime) {
  const timeTaken = (Date.now() - startTime) / 1000;
  const isCorrect = selectedTrack.id === correctTrack.id;

  recordAnswer(isCorrect, timeTaken, selectedTrack);
  stopPreview();

  el.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.trackId === correctTrack.id) {
      btn.classList.add("answer-btn--correct");
    } else if (btn.dataset.trackId === selectedTrack.id && !isCorrect) {
      btn.classList.add("answer-btn--wrong");
    }
  });

  el.querySelector("#score-display").textContent = `Score: ${getState().score}`;
  showReveal(el, correctTrack);

  const { currentRound, rounds } = getState();
  setTimeout(() => {
    if (currentRound >= rounds) {
      navigate(SCREENS.RESULTS);
    } else {
      startRound(el);
    }
  }, 2500);
}

//  UI helpers

function showReveal(el, track) {
  const albumArt = track.artworkUrl;
  const artImg = el.querySelector("#reveal-art");

  if (albumArt) {
    artImg.src = albumArt;
    artImg.hidden = false;
  } else {
    artImg.hidden = true;
  }

  el.querySelector("#reveal-track").textContent = track.trackName;
  el.querySelector("#reveal-artist").textContent = track.artistName ?? "";
  el.querySelector("#track-reveal").hidden = false;
}

function showError(el, message) {
  const errorEl = el.querySelector("#play-error");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

export { init };
