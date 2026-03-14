/**
 * Public API:
 *   mount(containerEl)         — inject player UI into a container element
 *   loadPreview(previewUrl)    — load a 30-second Spotify preview URL
 *   playPreview(durationSecs)  — play from start, auto-stop at durationSecs
 *   stopPreview()              — immediately halt playback
 *   resetPlayer()              — clear source and reset UI between rounds
 */

let audio = null; // <audio> element
let stopTimer = null; // setTimeout handle for duration cap
let rafId = null; // requestAnimationFrame handle for progress bar
let durationCap = 30; // seconds to play (set by playPreview)
let containerEl = null; // DOM node the player renders into

// ─── DOM refs (populated by mount()) ─────────────────────────────────────────
let playBtn = null;
let progressFill = null;
let countdownEl = null;
let tapFallback = null;
let volumeSlider = null;

// ─── Mount ───────────────────────────────────────────────────────────────────

//Render the player UI into `el` and wire up the audio element.

function mount(el) {
  containerEl = el;
  containerEl.innerHTML = `
    <div class="audio-player">
      <button class="audio-play-btn" aria-label="Play preview" disabled>
        ▶ Play
      </button>
      <div class="audio-tap-fallback" hidden>
        Tap to play preview
      </div>
      <div class="audio-progress-wrap" aria-hidden="true">
        <div class="audio-progress-bar">
          <div class="audio-progress-fill"></div>
        </div>
        <span class="audio-countdown">0s</span>
      </div>
      <div class="audio-volume-wrap">
        🔊
        <input class="audio-volume-slider" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume" />
      </div>
    </div>
  `;

  playBtn = containerEl.querySelector(".audio-play-btn");
  progressFill = containerEl.querySelector(".audio-progress-fill");
  countdownEl = containerEl.querySelector(".audio-countdown");
  tapFallback = containerEl.querySelector(".audio-tap-fallback");
  volumeSlider = containerEl.querySelector(".audio-volume-slider");

  audio = new Audio();
  audio.preload = "auto";
  audio.volume = 1;

  audio.addEventListener("play", _onPlay);
  audio.addEventListener("ended", stopPreview);

  // pause keeps position; play resumes from where it left off
  playBtn.addEventListener("click", () => {
    if (!audio.src) return;
    if (!audio.paused) {
      audio.pause();
      _clearTimers();
      playBtn.textContent = "▶ Play";
    } else {
      audio
        .play()
        .then(() => _hideTapFallback())
        .catch(() => {});
    }
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Load a preview URL into the audio element
function loadPreview(previewUrl) {
  _clearTimers();
  audio.src = previewUrl;
  audio.currentTime = 0;
  _setButtonReady();
}

/**
 * Play from the beginning and auto-stop after `durationSeconds`.
 * Shows autoplay fallback if the browser blocks autoplay.
 */
function playPreview(durationSeconds) {
  if (!audio || !audio.src) return;

  durationCap = durationSeconds;
  audio.currentTime = 0;

  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        _hideTapFallback();
      })
      .catch(() => {
        _showTapFallback(durationSeconds);
      });
  }
}

// immediately halt audio and clear all timers
function stopPreview() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  _clearTimers();
  _resetProgress();
  _setButtonReady();
}

// clear/prepare for next round
function resetPlayer() {
  stopPreview();
  if (audio) {
    audio.src = "";
    audio.removeAttribute("src");
    audio.load();
  }
  _hideTapFallback();
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.textContent = "▶ Play";
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _onPlay() {
  _startStopTimer();
  _animateProgress();
  if (playBtn) {
    playBtn.disabled = false;
    playBtn.textContent = "⏹ Stop";
  }
}

function _startStopTimer() {
  clearTimeout(stopTimer);
  const remaining = (durationCap - audio.currentTime) * 1000;
  stopTimer = setTimeout(stopPreview, remaining);
}

function _animateProgress() {
  cancelAnimationFrame(rafId);

  function step() {
    if (!audio || audio.paused) return;

    const elapsed = audio.currentTime;
    const pct = Math.min(elapsed / durationCap, 1) * 100;
    const remaining = Math.max(Math.ceil(durationCap - elapsed), 0);

    if (progressFill) progressFill.style.width = pct + "%";
    if (countdownEl) countdownEl.textContent = remaining + "s";

    if (pct < 100) rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame(step);
}

function _resetProgress() {
  if (progressFill) progressFill.style.width = "0%";
  if (countdownEl) countdownEl.textContent = "0s";
}

function _setButtonReady() {
  if (!playBtn) return;
  const hasSource = audio && audio.src && audio.src !== window.location.href;
  playBtn.disabled = !hasSource;
  playBtn.textContent = "▶ Play";
}

function _clearTimers() {
  clearTimeout(stopTimer);
  stopTimer = null;
  cancelAnimationFrame(rafId);
  rafId = null;
}

function _showTapFallback(durationSeconds) {
  if (!tapFallback) return;
  tapFallback.hidden = false;
  tapFallback.onclick = () => {
    tapFallback.hidden = true;
    durationCap = durationSeconds;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };
}

function _hideTapFallback() {
  if (tapFallback) tapFallback.hidden = true;
}

export { mount, loadPreview, playPreview, stopPreview, resetPlayer };
