import { setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";

function init() {
  const el = document.querySelector('[data-screen="modeSelect"]');

  el.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Music Quiz";

  const desc = document.createElement("p");
  desc.className = "app-desc";
  desc.textContent = "Select a game mode to get started.";

  const modeOptions = document.createElement("div");
  modeOptions.className = "mode-options";

  const artistBtn = document.createElement("button");
  artistBtn.className = "mode-card";
  artistBtn.id = "mode-artist";
  artistBtn.innerHTML = `
    <span class="mode-icon">🎤</span>
    <h2 class="mode-card-title">Artist Mode</h2>
    <p class="mode-card-desc">Pick an artist and identify their songs from short audio previews.</p>
    <span class="mode-card-cta">Choose Artist →</span>
  `;
  artistBtn.addEventListener("click", () => {
    setState({ mode: "artist" });
    navigate(SCREENS.PICK_ARTIST_OR_GENRE);
  });

  // Genre Mode button
  const genreBtn = document.createElement("button");
  genreBtn.className = "mode-card";
  genreBtn.id = "mode-genre";
  genreBtn.innerHTML = `
    <span class="mode-icon">🎵</span>
    <h2 class="mode-card-title">Genre Mode</h2>
    <p class="mode-card-desc">Pick a genre and guess tracks from across that style of music.</p>
    <span class="mode-card-cta">Choose Genre →</span>
  `;
  genreBtn.addEventListener("click", () => {
    setState({ mode: "genre" });
    navigate(SCREENS.PICK_ARTIST_OR_GENRE);
  });

  // Append all elements
  modeOptions.appendChild(artistBtn);
  modeOptions.appendChild(genreBtn);
  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(modeOptions);
  el.appendChild(container);
}

export { init };
