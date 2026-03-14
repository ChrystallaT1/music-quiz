import { setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";

function init() {
  const el = document.querySelector('[data-screen="modeSelect"]');

  el.innerHTML = `
    <div class="screen-container">
      <h1 class="app-title">Music Quiz</h1>
      <p class="app-desc">Select a game mode to get started.</p>

      <div class="mode-options">
        <button class="mode-card" id="mode-artist">
          <span class="mode-icon">🎤</span>
          <h2 class="mode-card-title">Artist Mode</h2>
          <p class="mode-card-desc">Pick an artist and identify their songs from short audio previews.</p>
          <span class="mode-card-cta">Choose Artist →</span>
        </button>

        <button class="mode-card" id="mode-genre">
          <span class="mode-icon">🎵</span>
          <h2 class="mode-card-title">Genre Mode</h2>
          <p class="mode-card-desc">Pick a genre and guess tracks from across that style of music.</p>
          <span class="mode-card-cta">Choose Genre →</span>
        </button>
      </div>
    </div>
  `;

  el.querySelector("#mode-artist").addEventListener("click", () => {
    setState({ mode: "artist" });
    navigate(SCREENS.PICK_ARTIST_OR_GENRE);
  });

  el.querySelector("#mode-genre").addEventListener("click", () => {
    setState({ mode: "genre" });
    navigate(SCREENS.PICK_ARTIST_OR_GENRE);
  });
}

export { init };
