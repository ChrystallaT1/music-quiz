import { getState, setState } from "../js/state.js";
import { navigate, SCREENS } from "../js/router.js";
import { searchArtists } from "../music-api/itunesApi.js";

// Static genres
const GENRES = [
  { id: "pop", name: "Pop", icon: "🎤" },
  { id: "rock", name: "Rock", icon: "🎸" },
  { id: "hip-hop", name: "Hip-Hop", icon: "🎧" },
  { id: "r-n-b", name: "R&B", icon: "🎶" },
  { id: "electronic", name: "Electronic", icon: "🎛️" },
  { id: "dance", name: "Dance", icon: "💃" },
  { id: "indie", name: "Indie", icon: "🌿" },
  { id: "jazz", name: "Jazz", icon: "🎷" },
  { id: "classical", name: "Classical", icon: "🎻" },
  { id: "soul", name: "Soul", icon: "🕊️" },
  { id: "metal", name: "Metal", icon: "🤘" },
  { id: "country", name: "Country", icon: "🤠" },
  { id: "reggae", name: "Reggae", icon: "🌴" },
  { id: "latin", name: "Latin", icon: "🪘" },
];

function init() {
  const { mode } = getState();
  const el = document.querySelector('[data-screen="pickArtistOrGenre"]');

  // UI based on selected mode

  const container = document.createElement("div");
  container.className = "screen-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = mode === "artist" ? "Pick an Artist" : "Pick a Genre";

  const desc = document.createElement("p");
  desc.className = "app-desc";
  desc.textContent =
    mode === "artist"
      ? "Search for an artist to quiz yourself on their songs."
      : "Choose a genre to quiz yourself on.";

  const content = document.createElement("div");
  content.id = "pick-content";
  content.className = "pick-content";

  const error = document.createElement("p");
  error.id = "pick-error";
  error.className = "error-msg";
  error.hidden = true;

  const actions = document.createElement("div");
  actions.className = "pick-actions";

  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-secondary";
  backBtn.id = "back-btn";
  backBtn.textContent = "← Back";
  backBtn.addEventListener("click", () => navigate(SCREENS.MODE_SELECT));

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-primary";
  nextBtn.id = "next-btn";
  nextBtn.textContent = "Next →";
  // Validate selection before proceeding
  nextBtn.addEventListener("click", () => {
    const { artistOrGenre } = getState();
    if (!artistOrGenre) {
      showError(
        el,
        mode === "artist"
          ? "Please select an artist first."
          : "Please select a genre first.",
      );
      return;
    }
    navigate(SCREENS.GAME_SETTINGS);
  });

  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);

  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(content);
  container.appendChild(error);
  container.appendChild(actions);
  el.appendChild(container);

  if (mode === "artist") {
    renderArtistSearch(content);
  } else {
    renderGenreGrid(content);
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

function renderArtistSearch(content) {
  const container = document.createElement("div");
  container.className = "artist-search";

  const input = document.createElement("input");
  input.id = "artist-input";
  input.className = "pick-input";
  input.type = "text";
  input.placeholder = "e.g. Daft Punk";
  input.autocomplete = "off";

  const list = document.createElement("ul");
  list.id = "artist-suggestions";
  list.className = "suggestions-list";
  list.hidden = true;

  // Shows the chosen artist's name after selection
  const pill = document.createElement("div");
  pill.id = "artist-selected";
  pill.className = "selected-pill";
  pill.hidden = true;

  container.appendChild(input);
  container.appendChild(list);
  container.appendChild(pill);
  content.appendChild(container);

  let debounceTimer = null;

  // Debounce to avoid firing a request on every keystroke
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 2) {
      hideSuggestions(list);
      return;
    }
    debounceTimer = setTimeout(
      () => fetchArtistSuggestions(content, list, input, pill, query),
      300,
    );
  });

  // close dropdown when clicking outside the search container
  document.addEventListener(
    "click",
    (e) => {
      if (!container.contains(e.target)) hideSuggestions(list);
    },
    { once: false },
  );
}

async function fetchArtistSuggestions(content, list, input, pill, query) {
  // spinner while waiting for iTunes response
  list.innerHTML = "";
  const spinner = document.createElement("li");
  spinner.className = "suggestion-loading";
  spinner.innerHTML = '<div class="spinner-sm"></div>';
  list.appendChild(spinner);
  list.hidden = false;

  try {
    const artists = await searchArtists(query);
    list.innerHTML = "";

    if (!artists.length) {
      const empty = document.createElement("li");
      empty.className = "suggestion-empty";
      empty.textContent = "No artists found";
      list.appendChild(empty);
      return;
    }

    artists.forEach((artist) => {
      const item = document.createElement("li");
      item.className = "suggestion-item";
      item.dataset.id = artist.id;
      item.dataset.name = artist.name;

      const img = document.createElement("div");
      img.className = "suggestion-img suggestion-img--placeholder";

      const name = document.createElement("span");
      name.textContent = artist.name;

      item.appendChild(img);
      item.appendChild(name);

      item.addEventListener("click", () => {
        const el = content.closest('[data-screen="pickArtistOrGenre"]');
        setState({ artistOrGenre: artist.name }); // Persist selection to global state
        hideError(el);
        pill.textContent = `✓ ${artist.name}`;
        pill.hidden = false;
        hideSuggestions(list);
        input.value = "";
      });

      list.appendChild(item);
    });
  } catch {
    list.innerHTML = "";
    const error = document.createElement("li");
    error.className = "suggestion-empty";
    error.textContent = "Failed to load suggestions";
    list.appendChild(error);
  }
}

function hideSuggestions(list) {
  list.hidden = true;
}

// --- Genre Mode ---

function renderGenreGrid(content) {
  const grid = document.createElement("div");
  grid.className = "genre-grid";

  GENRES.forEach((genre) => {
    const tile = document.createElement("button");
    tile.className = "genre-tile";
    tile.dataset.id = genre.id;
    tile.dataset.name = genre.name;

    const icon = document.createElement("span");
    icon.className = "genre-tile-icon";
    icon.textContent = genre.icon;

    const name = document.createElement("span");
    name.textContent = genre.name;

    tile.appendChild(icon);
    tile.appendChild(name);

    tile.addEventListener("click", () => {
      // deselect all tiles,  highlight the clicked one
      grid
        .querySelectorAll(".genre-tile")
        .forEach((t) => t.classList.remove("genre-tile--selected"));
      tile.classList.add("genre-tile--selected");
      const el = content.closest('[data-screen="pickArtistOrGenre"]');
      setState({ artistOrGenre: genre.name });
      hideError(el);
    });

    grid.appendChild(tile);
  });

  content.appendChild(grid);
}

export { init };
