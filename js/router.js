import { getState } from "./state.js";
import {
  exchangeCodeForToken,
  storeTokens,
  handleAuthError,
  onLogout,
} from "../spotify/authPkce.js";
import { init as initLanding } from "../screens/landing.js";
import { init as initModeSelect } from "../screens/modeSelect.js";
import { init as initPickArtistOrGenre } from "../screens/pickArtistOrGenre.js";
import { init as initGameSettings } from "../screens/gameSettings.js";
import { init as initPlay } from "../screens/play.js";
import { init as initResults } from "../screens/results.js";

const SCREENS = {
  LANDING: "landing",
  MODE_SELECT: "modeSelect",
  PICK_ARTIST_OR_GENRE: "pickArtistOrGenre",
  GAME_SETTINGS: "gameSettings",
  PLAY: "play",
  RESULTS: "results",
};

//init function
const screenInits = {
  [SCREENS.LANDING]: initLanding,
  [SCREENS.MODE_SELECT]: initModeSelect,
  [SCREENS.PICK_ARTIST_OR_GENRE]: initPickArtistOrGenre,
  [SCREENS.GAME_SETTINGS]: initGameSettings,
  [SCREENS.PLAY]: initPlay,
  [SCREENS.RESULTS]: initResults,
};

// show  target screen, hides  others, calls the screen's init()
function navigate(screenName) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.hidden = true;
  });

  const target = document.querySelector(`[data-screen="${screenName}"]`);
  if (target) target.hidden = false;

  const initFn = screenInits[screenName];
  if (initFn) initFn();
}

// soft-navigate to landing on logout instead of a hard page reload
onLogout(() => navigate(SCREENS.LANDING));

// runs on page load — handles post-auth callback or routes based on auth status
async function init() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || sessionStorage.getItem("spotify_oauth_code");
  const error = params.get("error");

  // Post-auth redirect: ?code= or ?error= present in the URL
  if (code || error) {
    if (error) {
      handleAuthError(error);
      navigate(SCREENS.LANDING);
      return;
    }

    try {
      const tokenData = await exchangeCodeForToken(code);
      sessionStorage.removeItem("spotify_oauth_code");
      storeTokens(tokenData);
      window.history.replaceState({}, "", window.location.pathname);
      navigate(SCREENS.MODE_SELECT);
    } catch (err) {
      sessionStorage.removeItem("spotify_oauth_code");
      navigate(SCREENS.LANDING);
    }
    return;
  }

  // normal load — go straight in if already authenticated, otherwise show landing
  const { accessToken } = getState();
  if (accessToken) {
    navigate(SCREENS.MODE_SELECT);
  } else {
    navigate(SCREENS.LANDING);
  }
}

export { SCREENS, navigate, init };
