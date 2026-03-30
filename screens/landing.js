import { navigate, SCREENS } from "../js/router.js";

function init() {
  const el = document.querySelector('[data-screen="landing"]');

  el.innerHTML = "";

  const container = document.createElement("div");
  container.className = "screen-container";

  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = "Music Quiz";

  const desc = document.createElement("p");
  desc.className = "app-desc";
  desc.textContent =
    "Test your music knowledge with real music previews. Can you name that track?";

  const playBtn = document.createElement("button");
  playBtn.className = "btn btn-primary";
  playBtn.id = "play-btn";
  playBtn.textContent = "Play";
  playBtn.addEventListener("click", () => {
    navigate(SCREENS.MODE_SELECT);
  });

  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(playBtn);
  el.appendChild(container);
}

export { init };
