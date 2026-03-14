import { getState, setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";
import { searchArtists, fetchCategories } from "../spotify/spotifyApi.js";

function init() {
  const { mode } = getState();
  const el = document.querySelector('[data-screen="pickArtistOrGenre"]');

  el.innerHTML = `
    <div class="screen-container">
      <h1 class="app-title">${mode === "artist" ? "Pick an Artist" : "Pick a Genre"}</h1>
      <p class="app-desc">${mode === "artist" ? "Search for an artist to quiz yourself on their songs." : "Choose a genre to quiz yourself on."}</p>

      <div id="pick-content" class="pick-content"></div>

      <p id="pick-error" class="error-msg" hidden></p>

      <div class="pick-actions">
        <button class="btn btn-secondary" id="back-btn">← Back</button>
        <button class="btn btn-primary" id="next-btn">Next →</button>
      </div>
    </div>
  `;

  el.querySelector("#back-btn").addEventListener("click", () => {
    navigate(SCREENS.MODE_SELECT);
  });

  el.querySelector("#next-btn").addEventListener("click", () => {
    const { artistOrGenre } = getState();
    if (!artistOrGenre) {
      showError(el, mode === "artist" ? "Please select an artist first." : "Please select a genre first.");
      return;
    }
    navigate(SCREENS.GAME_SETTINGS);
  });

  if (mode === "artist") {
    renderArtistSearch(el);
  } else {
    renderGenreGrid(el);
  }
}

function showError(el, message) {
  const err = el.querySelector("#pick-error");
  err.textContent = message;
  err.hidden = false;
}

function hideError(el) {
  el.querySelector("#pick-error").hidden = true;
}

// --- Artist Mode ---

function renderArtistSearch(el) {
  const content = el.querySelector("#pick-content");
  content.innerHTML = `
    <div class="artist-search">
      <input
        id="artist-input"
        class="pick-input"
        type="text"
        placeholder="e.g. Daft Punk"
        autocomplete="off"
      />
      <ul id="artist-suggestions" class="suggestions-list" hidden></ul>
      <div id="artist-selected" class="selected-pill" hidden></div>
    </div>
  `;

  const input = content.querySelector("#artist-input");
  let debounceTimer = null;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 2) {
      hideSuggestions(content);
      return;
    }
    debounceTimer = setTimeout(() => fetchArtistSuggestions(el, content, query), 300);
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!content.contains(e.target)) hideSuggestions(content);
  }, { once: false });
}

async function fetchArtistSuggestions(el, content, query) {
  const list = content.querySelector("#artist-suggestions");
  list.innerHTML = `<li class="suggestion-loading"><div class="spinner-sm"></div></li>`;
  list.hidden = false;

  try {
    const artists = await searchArtists(query);
    if (!artists.length) {
      list.innerHTML = `<li class="suggestion-empty">No artists found</li>`;
      return;
    }
    list.innerHTML = artists.map((a) => `
      <li class="suggestion-item" data-id="${a.id}" data-name="${a.name}">
        ${a.images?.[0] ? `<img src="${a.images[a.images.length - 1].url}" alt="" class="suggestion-img" />` : `<div class="suggestion-img suggestion-img--placeholder"></div>`}
        <span>${a.name}</span>
      </li>
    `).join("");

    list.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        const name = item.dataset.name;
        setState({ artistOrGenre: { id, name } });
        hideError(el);
        showSelectedPill(content, name);
        hideSuggestions(content);
        content.querySelector("#artist-input").value = "";
      });
    });
  } catch {
    list.innerHTML = `<li class="suggestion-empty">Failed to load suggestions</li>`;
  }
}

function hideSuggestions(content) {
  const list = content.querySelector("#artist-suggestions");
  if (list) list.hidden = true;
}

function showSelectedPill(content, name) {
  const pill = content.querySelector("#artist-selected");
  pill.textContent = `✓ ${name}`;
  pill.hidden = false;
}

// --- Genre Mode ---

async function renderGenreGrid(el) {
  const content = el.querySelector("#pick-content");
  content.innerHTML = "";

  try {
    const categories = fetchCategories();
    content.innerHTML = `<div class="genre-grid">${
      categories.map((c) => `
        <button class="genre-tile" data-id="${c.id}" data-name="${c.name}">
          <span class="genre-tile-icon">${c.icon}</span>
          <span>${c.name}</span>
        </button>
      `).join("")
    }</div>`;

    content.querySelectorAll(".genre-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        content.querySelectorAll(".genre-tile").forEach((t) => t.classList.remove("genre-tile--selected"));
        tile.classList.add("genre-tile--selected");
        setState({ artistOrGenre: { id: tile.dataset.id, name: tile.dataset.name } });
        hideError(el);
      });
    });
  } catch {
    content.innerHTML = `<p class="error-msg">Failed to load genres. Please try again.</p>`;
  }
}

export { init };
