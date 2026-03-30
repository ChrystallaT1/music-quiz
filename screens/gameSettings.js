import { getState, setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";
import {
  searchArtistTracks,
  fetchGenreTracks,
} from "../music-api/itunesApi.js";

const DEFAULTS = { difficulty: "medium", rounds: 10, previewLength: 10 };

// Minimum tracks needed to safely run a game
const MIN_TRACKS_ARTIST = 4;
const MIN_TRACKS_GENRE = 4;

function init() {
  const el = document.querySelector('[data-screen="gameSettings"]');
  const selections = { ...DEFAULTS };

  const container = document.createElement("div");
  container.className = "screen-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Game Settings";

  const desc = document.createElement("p");
  desc.className = "app-desc";
  desc.textContent = "Customise your game before you start.";

  const groups = document.createElement("div");
  groups.className = "settings-groups";
  groups.appendChild(
    buildSettingGroup("Difficulty", "difficulty", [
      { value: "easy", label: "Easy", hint: "Popular tracks" },
      { value: "medium", label: "Medium", hint: "Mixed tracks" },
      { value: "hard", label: "Hard", hint: "Deep cuts" },
    ]),
  );
  groups.appendChild(
    buildSettingGroup("Questions", "rounds", [
      { value: "5", label: "5" },
      { value: "10", label: "10" },
      { value: "15", label: "15" },
    ]),
  );
  groups.appendChild(
    buildSettingGroup("Preview Length", "previewLength", [
      { value: "5", label: "5s" },
      { value: "10", label: "10s" },
      { value: "15", label: "15s" },
    ]),
  );

  const feedback = document.createElement("p");
  feedback.id = "settings-feedback";
  feedback.className = "settings-feedback";
  feedback.hidden = true;

  const actions = document.createElement("div");
  actions.className = "pick-actions";

  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-secondary";
  backBtn.id = "back-btn";
  backBtn.textContent = "← Back";
  backBtn.addEventListener("click", () =>
    navigate(SCREENS.PICK_ARTIST_OR_GENRE),
  );

  const startBtn = document.createElement("button");
  startBtn.className = "btn btn-primary";
  startBtn.id = "start-btn";
  startBtn.textContent = "Start Game";
  startBtn.addEventListener("click", () => handleStart(el, selections));

  actions.appendChild(backBtn);
  actions.appendChild(startBtn);

  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(groups);
  container.appendChild(feedback);
  container.appendChild(actions);
  el.appendChild(container);

  applySelections(el, selections);

  // handle option clicks for all setting groups
  groups.querySelectorAll(".settings-options").forEach((group) => {
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

      hideFeedback(el);
    });
  });
}

function buildSettingGroup(label, setting, options) {
  const group = document.createElement("div");
  group.className = "settings-group";

  const heading = document.createElement("h3");
  heading.className = "settings-label";
  heading.textContent = label;

  const optionsEl = document.createElement("div");
  optionsEl.className = "settings-options";
  optionsEl.dataset.setting = setting;

  options.forEach(({ value, label: text, hint }) => {
    const btn = document.createElement("button");
    btn.className = "settings-option";
    btn.dataset.value = value;
    btn.textContent = text;
    if (hint) {
      const span = document.createElement("span");
      span.className = "settings-hint";
      span.textContent = hint;
      btn.appendChild(span);
    }
    optionsEl.appendChild(btn);
  });

  group.appendChild(heading);
  group.appendChild(optionsEl);
  return group;
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
      tracks = await searchArtistTracks(artistOrGenre, selections.difficulty);
    } else {
      tracks = await fetchGenreTracks(artistOrGenre, selections.difficulty);
    }

    const minNeeded = Math.max(
      selections.rounds,
      mode === "artist" ? MIN_TRACKS_ARTIST : MIN_TRACKS_GENRE,
    );

    if (tracks.length < minNeeded) {
      showFeedback(
        el,
        `Only ${tracks.length} playable track${tracks.length === 1 ? "" : "s"} found — try fewer rounds.`,
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
  } catch (err) {
    console.error("[gameSettings] handleStart error:", err);
    showFeedback(el, `Failed to load tracks: ${err.message || err}`, "error");
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
