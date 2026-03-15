import { getState, setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";
import { searchArtistTracks, fetchGenreTracks } from "../spotify/spotifyApi.js";

const DEFAULTS = { difficulty: "medium", rounds: 10, previewLength: 10 };

// Minimum tracks needed to safely run a game (must fill every round)
const MIN_TRACKS_ARTIST = 4;
const MIN_TRACKS_GENRE = 4;

function init() {
  const el = document.querySelector('[data-screen="gameSettings"]');

  el.innerHTML = `
    <div class="screen-container">
      <h1 class="app-title">Game Settings</h1>
      <p class="app-desc">Customise your game before you start.</p>

      <div class="settings-groups">

        <div class="settings-group">
          <h3 class="settings-label">Difficulty</h3>
          <div class="settings-options" data-setting="difficulty">
            <button class="settings-option" data-value="easy">Easy</button>
            <button class="settings-option" data-value="medium">Medium</button>
            <button class="settings-option" data-value="hard">Hard</button>
          </div>
        </div>

        <div class="settings-group">
          <h3 class="settings-label">Rounds</h3>
          <div class="settings-options" data-setting="rounds">
            <button class="settings-option" data-value="5">5</button>
            <button class="settings-option" data-value="10">10</button>
            <button class="settings-option" data-value="15">15</button>
          </div>
        </div>

        <div class="settings-group">
          <h3 class="settings-label">Preview Length</h3>
          <div class="settings-options" data-setting="previewLength">
            <button class="settings-option" data-value="5">5s</button>
            <button class="settings-option" data-value="10">10s</button>
            <button class="settings-option" data-value="15">15s</button>
            <button class="settings-option" data-value="30">30s</button>
          </div>
        </div>

      </div>

      <p id="settings-feedback" class="settings-feedback" hidden></p>

      <div class="pick-actions">
        <button class="btn btn-secondary" id="back-btn">← Back</button>
        <button class="btn btn-primary" id="start-btn">Start Game</button>
      </div>
    </div>
  `;

  const selections = { ...DEFAULTS };

  // Apply defaults visually
  applySelections(el, selections);

  // Wire up each options group
  el.querySelectorAll(".settings-options").forEach((group) => {
    group.addEventListener("click", (e) => {
      const option = e.target.closest(".settings-option");
      if (!option) return;

      const key = group.dataset.setting;
      const raw = option.dataset.value;
      selections[key] = isNaN(Number(raw)) ? raw : Number(raw);

      group
        .querySelectorAll(".settings-option")
        .forEach((o) =>
          o.classList.toggle("settings-option--selected", o === option),
        );

      // clear  feedback when user changes a setting
      hideFeedback(el);
    });
  });

  el.querySelector("#back-btn").addEventListener("click", () => {
    navigate(SCREENS.PICK_ARTIST_OR_GENRE);
  });

  el.querySelector("#start-btn").addEventListener("click", () =>
    handleStart(el, selections),
  );
}

function applySelections(el, selections) {
  for (const [key, value] of Object.entries(selections)) {
    const group = el.querySelector(`[data-setting="${key}"]`);
    if (!group) continue;
    group.querySelectorAll(".settings-option").forEach((opt) => {
      const optVal = isNaN(Number(opt.dataset.value))
        ? opt.dataset.value
        : Number(opt.dataset.value);
      opt.classList.toggle("settings-option--selected", optVal === value);
    });
  }
}

async function handleStart(el, selections) {
  const startBtn = el.querySelector("#start-btn");
  startBtn.disabled = true;
  startBtn.textContent = "Loading…";
  hideFeedback(el);

  const { mode, artistOrGenre } = getState();

  try {
    let tracks;
    if (mode === "artist") {
      tracks = await searchArtistTracks(
        artistOrGenre.name,
        selections.difficulty,
      );
    } else {
      tracks = await fetchGenreTracks(artistOrGenre.id, selections.difficulty);
    }

    const minNeeded = Math.max(
      selections.rounds,
      mode === "artist" ? MIN_TRACKS_ARTIST : MIN_TRACKS_GENRE,
    );

    if (tracks.length < minNeeded) {
      showFeedback(
        el,
        `Only ${tracks.length} playable track${tracks.length === 1 ? "" : "s"} found for ${selections.difficulty} difficulty — try an easier difficulty or fewer rounds.`,
        "warn",
      );
      startBtn.disabled = false;
      startBtn.textContent = "Start Game";
      return;
    }

    setState({
      difficulty: selections.difficulty,
      rounds: selections.rounds,
      previewLength: selections.previewLength,
      trackPool: tracks,
    });

    navigate(SCREENS.PLAY);
  } catch {
    showFeedback(
      el,
      "Failed to load tracks. Please check your connection and try again.",
      "error",
    );
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
  }
}

function showFeedback(el, message, type) {
  const p = el.querySelector("#settings-feedback");
  p.textContent = message;
  p.className =
    type === "warn"
      ? "settings-feedback warn-msg"
      : "settings-feedback error-msg";
  p.hidden = false;
}

function hideFeedback(el) {
  el.querySelector("#settings-feedback").hidden = true;
}

export { init };
