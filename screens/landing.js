import { getState } from "../js/state.js";
import { redirectToSpotify } from "../spotify/authPkce.js";
import { navigate, SCREENS } from "../js/router.js";

function init() {
  const el = document.querySelector('[data-screen="landing"]');
  const { accessToken } = getState();

  el.innerHTML = `
    <div class="screen-container">
      <h1 class="app-title">Music Quiz</h1>
      <p class="app-desc">Test your music knowledge with real Spotify previews. Can you name that track?</p>

      ${
        accessToken
          ? `<button class="btn btn-primary" id="play-btn">Play</button>`
          : `<button class="btn btn-primary" id="connect-btn">Connect with Spotify</button>`
      }

      <div id="auth-error" class="error-msg" hidden></div>

      <div id="loading-indicator" class="loading-wrap" hidden>
        <div class="spinner"></div>
        <p>Redirecting to Spotify&hellip;</p>
      </div>
    </div>
  `;

  if (accessToken) {
    el.querySelector("#play-btn").addEventListener("click", () => {
      navigate(SCREENS.MODE_SELECT);
    });
  } else {
    const connectBtn = el.querySelector("#connect-btn");
    connectBtn.addEventListener("click", () => {
      connectBtn.disabled = true;
      el.querySelector("#loading-indicator").hidden = false;
      redirectToSpotify();
    });
  }
}

export { init };
