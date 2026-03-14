import { getState } from "../js/state.js";
import { prepareAuthUrl } from "../spotify/authPkce.js";
import { navigate, SCREENS } from "../js/router.js";

async function init() {
  const el = document.querySelector('[data-screen="landing"]');
  const { accessToken } = getState();

  el.innerHTML = `
    <div class="screen-container">
      <h1 class="app-title">Music Quiz</h1>
      <p class="app-desc">Test your music knowledge with real Spotify previews. Can you name that track?</p>

      ${
        accessToken
          ? `<button class="btn btn-primary" id="play-btn">Play</button>`
          : `
            <div id="btn-wrap" class="loading-wrap">
              <div class="spinner"></div>
            </div>
          `
      }

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
    const btnWrap = el.querySelector("#btn-wrap");

    const authUrl = await prepareAuthUrl();

    btnWrap.outerHTML = `<a class="btn btn-primary" id="connect-link" href="${authUrl}">Connect with Spotify</a>`;

    el.querySelector("#connect-link").addEventListener("click", () => {
      el.querySelector("#loading-indicator").hidden = false;
    });
  }
}

export { init };
