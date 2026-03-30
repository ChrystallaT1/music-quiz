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
  if (target) {
    target.hidden = false;
    target.innerHTML = "";
  }

  const initFn = screenInits[screenName];
  if (initFn) initFn();
}

function init() {
  navigate(SCREENS.LANDING);
}

export { SCREENS, navigate, init };
