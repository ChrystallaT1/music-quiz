# Music Quiz — Requirements

---

## 1. Project Setup & Configuration

### 1. File Structure & Initialisation

#### Description

Set up the full project directory, create all necessary files, and configure the Spotify Developer app so the project is ready to build on.

#### Acceptance Criteria

- [✅] Project folder structure is created (`game/`, `screens/`, `spotify/`, `js/`, `assets/`, `docs/`)
- [✅] `index.html` is created as the single entry point for the app
- [✅] `styles.css` is created and linked in `index.html`
- [✅] `app.js` is created as the main JavaScript entry point
- [✅] All screen JS files are created as empty modules (`landing.js`, `modeSelect.js`, `gameSettings.js`, `pickArtistOrGenre.js`, `play.js`, `results.js`)
- [✅] All logic JS files are created as empty modules (`questionBuilder.js`, `scoring.js`, `authPkce.js`, `spotifyApi.js`, `router.js`, `state.js`, `audioPlayer.js`)
- [✅] `.gitignore` is configured (ignoring secrets, `.env`, any sensitive files)
- [✅] A new app is registered on the Spotify Developer Dashboard
- [✅] The Redirect URI is set in the Spotify app settings (e.g. `http://localhost:5500/callback`)
- [✅] The Client ID is stored as a constant in a config section of `authPkce.js`

---

## 2. Authentication

### 2. PKCE Auth Flow (`authPkce.js`)

#### Description

Implement the full OAuth 2.0 Authorization Code with PKCE flow so users can securely connect their Spotify account without exposing any client secret. This is the foundation that gates access to all API functionality.

#### User Stories

- As a user, I want to log in with my Spotify account so that the app can access music data on my behalf.
- As a user, I want my session to stay active during a game so that I am not interrupted mid-play.
- As a user, I want a logout option so that I can disconnect my account.

#### Acceptance Criteria

- [✅] PKCE code verifier is generated (random string, 43–128 characters)
- [✅] PKCE code challenge is generated (SHA-256 hash of verifier, base64url encoded)
- [✅] Spotify authorisation URL is built with all required query params (`client_id`, `response_type`, `redirect_uri`, `scope`, `code_challenge_method`, `code_challenge`)
- [✅] User is redirected to the Spotify login/auth page when login is triggered
- [✅] OAuth callback is handled — `code` param is extracted from the return URL
- [✅] Auth code is exchanged for an access token via `POST /api/token`
- [✅] Access token, refresh token, and expiry timestamp are stored in `state.js`
- [✅] Token expiry is checked before every API call
- [✅] Silent token refresh is implemented using the refresh token when the access token has expired
- [✅] `logout()` function clears all stored tokens and resets state
- [✅] Auth errors are handled gracefully (e.g. user denies permission, invalid state param)

---

## 3. Core Infrastructure

### 3. State Management (`state.js`)

#### Description

A single centralised state object that all parts of the app read from and write to, preventing data from becoming out of sync across screens.

#### Acceptance Criteria

- [✅] A central `state` object is defined and exported
- [✅] Auth fields are included: `accessToken`, `refreshToken`, `tokenExpiry`
- [✅] Game settings fields are included: `mode`, `difficulty`, `rounds`, `previewLength`, `artistOrGenre`
- [✅] Active game fields are included: `currentRound`, `score`, `trackPool`, `currentTrack`, `answerChoices`, `roundResults`
- [✅] `setState(updates)` helper merges partial updates into state
- [✅] `resetGameState()` helper clears only game-related fields between plays
- [✅] `getState()` helper reads current state from anywhere in the app

---

### 4. Routing (`router.js`)

#### Description

A simple client-side router that controls which screen is visible at any time, ensuring the single-page app navigates cleanly without page reloads or broken state.

#### Acceptance Criteria

- [✅] All screen names are defined as constants (e.g. `SCREENS.LANDING`, `SCREENS.PLAY`, etc.)
- [✅] `navigate(screenName)` function shows the correct screen and hides all others
- [✅] Screen switching is handled by toggling a CSS class or `data-screen` attribute
- [✅] Each screen's `init()` function is called when navigating to it
- [✅] Initial page load detects whether the user is already authenticated and routes accordingly
- [✅] Post-auth redirect is handled — `?code=` in the URL is detected and routed to the callback handler

---

## 4. Spotify API Layer

### 5. API Integration (`spotifyApi.js`)

#### Description

All communication with the Spotify Web API is centralised here. This layer handles authentication headers, error responses, and data filtering so that the rest of the app works with clean, ready-to-use data.

#### User Stories

- As a player, I want the app to pull real tracks from Spotify so that the quiz uses genuine music data.
- As a player, I want audio previews to always be available so that I can actually hear the clips.

#### Acceptance Criteria

- [✅] Base `apiRequest(endpoint, options)` helper attaches the Bearer token header and handles `401` errors
- [✅] Search for artist tracks is implemented: `GET /v1/search?q={artist}&type=track&limit=50`
- [✅] Fetch browse categories (genres) is implemented: `GET /v1/browse/categories?limit=50`
- [✅] Fetch playlists for a category is implemented: `GET /v1/browse/categories/{id}/playlists`
- [✅] Fetch tracks from a playlist is implemented: `GET /v1/playlists/{id}/tracks`
- [✅] Tracks where `preview_url` is `null` are filtered out from all results
- [✅] Tracks are filtered by popularity based on selected difficulty (Easy: ≥70, Medium: 40–69, Hard: <40)
- [✅] `429 Too Many Requests` responses are handled by reading `Retry-After` and retrying
- [✅] General API errors (non-2xx responses) surface a user-visible error message
- [✅] Fetched track pools are cached in state to avoid redundant API calls mid-game

---

## 5. Game Logic

### 6. Question Builder (`game/questionBuilder.js`)

#### Description

Responsible for constructing each quiz question — selecting the correct answer and generating plausible decoys — so that every round presents a fair and varied challenge.

#### Acceptance Criteria

- [✅] `buildQuestion(trackPool, mode)` selects one correct answer track from the pool
- [✅] 3 decoy answer options are generated from the remaining pool
- [✅] In Artist Mode, all 4 options are different songs by the same artist
- [✅] In Genre Mode, decoys come from different artists within the same genre pool
- [✅] The 4 answer options are shuffled into a random order
- [✅] A question object is returned: `{ correctTrack, options: [track, track, track, track] }`
- [✅] The same track is never used as both the correct answer and a decoy in the same question
- [✅] Tracks used as the correct answer in previous rounds are not reused

---

### 7. Scoring (`game/scoring.js`)

#### Description

Tracks the player's performance across all rounds and produces the data needed for the results screen at the end of the game.

#### Acceptance Criteria

- [✅] `recordAnswer(isCorrect, timeTaken)` logs the result of each round
- [✅] +1 point is awarded for a correct answer
- [✅] `getFinalScore()` returns total correct answers and total rounds
- [✅] `getRoundResults()` returns a per-round breakdown (track name, correct answer, user's pick, result)
- [✅] `resetScores()` clears all scoring data between games

---

### 8. Audio Player (`js/audioPlayer.js`)

#### Description

Handles all audio playback for track previews, including trimming previews to the user's chosen duration, showing playback progress, and cleaning up between rounds.

#### User Stories

- As a player, I want to hear a preview of the song so that I can try to identify it.
- As a player, I want to see how much of the preview is left so that I can decide when to guess.

#### Acceptance Criteria

- [ ] `loadPreview(previewUrl)` loads a Spotify 30-second preview into an `<audio>` element
- [ ] `playPreview(durationSeconds)` plays from the start and auto-stops after the configured preview length
- [ ] `stopPreview()` immediately stops audio playback
- [ ] `resetPlayer()` clears the loaded audio source between rounds
- [ ] A fallback "tap to play" is shown if browser autoplay is blocked
- [ ] A visible progress bar or countdown timer is shown during preview playback
- [ ] Audio is muted/stopped automatically when the user submits an answer

---

## 6. Screens

### 9. Landing Screen (`screens/landing.js`)

#### Description

The first screen a user sees. Its primary job is to authenticate the user with Spotify before anything else in the app can function.

#### User Stories

- As a first-time user, I want a clear login button so that I can connect my Spotify account easily.
- As a returning user, I want to skip the login step if I'm already connected so that I can get into the game quickly.

#### Acceptance Criteria

- [ ] App title and brief description are rendered
- [ ] A "Connect with Spotify" button is shown and triggers the PKCE auth flow
- [ ] If the user is already authenticated, a "Play" button is shown instead of the login button
- [ ] A loading indicator is displayed while the auth redirect is in progress

---

### 10. Mode Select Screen (`screens/modeSelect.js`)

#### Description

Lets the player choose between Artist Mode and Genre Mode before configuring their game.

#### User Stories

- As a player, I want to choose a game mode so that I can play the style of quiz I prefer.

#### Acceptance Criteria

- [ ] Two clearly distinct options are rendered: Artist Mode and Genre Mode
- [ ] A brief description of each mode is shown
- [ ] On selection, the chosen mode is saved to state and the app navigates to `pickArtistOrGenre`

---

### 11. Pick Artist or Genre Screen (`screens/pickArtistOrGenre.js`)

#### Description

Allows the player to specify which artist or genre they want the quiz to be based on, with live Spotify data powering the selection.

#### User Stories

- As a player in Artist Mode, I want to search for an artist by name so that I can quiz myself on their songs.
- As a player in Genre Mode, I want to browse available genres so that I can pick a style of music I enjoy.

#### Acceptance Criteria

- [ ] In Artist Mode, a text input is rendered for the user to type an artist name
- [ ] Live autocomplete suggestions appear as the user types, powered by the Spotify search API
- [ ] On selecting a suggestion, the artist is saved to state
- [ ] In Genre Mode, a list or grid of available Spotify categories is fetched and displayed
- [ ] On selecting a genre, the category ID is saved to state
- [ ] A loading spinner is shown while fetching suggestions or categories
- [ ] A validation message is shown if the user tries to proceed without making a selection
- [ ] A Back button returns the user to mode select

---

### 12. Game Settings Screen (`screens/gameSettings.js`)

#### Description

Lets the player customise their game before starting — difficulty, number of rounds, and preview length.

#### User Stories

- As a player, I want to set the difficulty so that the game matches my music knowledge.
- As a player, I want to choose how many rounds to play so that I can fit the game into my available time.
- As a player, I want to set how long the preview plays so that I can make the game easier or harder.

#### Acceptance Criteria

- [ ] A Difficulty selector is rendered: Easy / Medium / Hard
- [ ] A Number of Rounds selector is rendered: 5 / 10 / 15
- [ ] A Preview Length selector is rendered: 5s / 10s / 15s / 30s
- [ ] Sensible defaults are pre-populated (Medium / 10 rounds / 10s)
- [ ] All values are saved to state on confirmation
- [ ] An error or warning is shown if the chosen difficulty yields too few playable tracks
- [ ] A Back button and a Start Game button are present

---

### 13. Play Screen (`screens/play.js`)

#### Description

The core gameplay screen. Presents the audio preview, the four answer options, and feedback after each guess, then advances through all rounds before sending the player to results.

#### User Stories

- As a player, I want to hear a preview and see four song options so that I can make my guess.
- As a player, I want to see whether I was right or wrong after guessing so that I can learn the correct answer.
- As a player, I want the game to automatically move to the next round so that the flow stays smooth.

#### Acceptance Criteria

- [ ] Current round number and total rounds are displayed (e.g. "Round 3 of 10")
- [ ] Current score is displayed
- [ ] Audio preview player is shown with a play button and progress indicator
- [ ] 4 answer option buttons are rendered for each round using `buildQuestion()`
- [ ] Audio preview starts automatically (or on tap if autoplay is blocked)
- [ ] All answer buttons are locked once the user makes a selection
- [ ] The correct answer is highlighted green and the wrong selection highlighted red after guessing
- [ ] The track name, artist name, and album art of the correct answer are shown after each round
- [ ] The app auto-advances to the next round after a short delay (2–3 seconds)
- [ ] On the final round, the app navigates to the results screen instead of looping
- [ ] A friendly error is shown if the track pool runs out before all rounds are complete

---

### 14. Results Screen (`screens/results.js`)

#### Description

Summarises the player's performance at the end of the game with a final score, a per-round breakdown, and options to play again or return home.

#### User Stories

- As a player, I want to see my final score so that I know how well I did.
- As a player, I want to review each round so that I can see which tracks I missed.
- As a player, I want an easy way to play again so that I can try to improve my score.

#### Acceptance Criteria

- [ ] Final score is displayed prominently (e.g. "7 / 10")
- [ ] A performance message is shown based on score (e.g. "Perfect score!", "Not bad!", "Keep practising!")
- [ ] A per-round breakdown is rendered showing: track played, user's answer, correct answer, and result
- [ ] A Play Again button resets game state and returns to mode select
- [ ] A Change Settings button returns to the settings screen with the same mode/artist/genre
- [ ] A Home button returns to the landing screen

---

## 7. UI & Styling

### 15. Styling & Responsiveness (`styles.css`)

#### Description

A cohesive visual design that feels consistent with Spotify's aesthetic, works on all screen sizes, and provides clear interactive feedback throughout the game.

#### User Stories

- As a player, I want the app to look polished and on-brand so that it feels professional.
- As a mobile user, I want the app to work comfortably on my phone so that I can play anywhere.

#### Acceptance Criteria

- [ ] A consistent colour palette is defined using CSS variables (Spotify green `#1DB954`, dark backgrounds, white text)
- [ ] All screen containers share a consistent layout (max-width, centred, padding)
- [ ] All buttons have hover, active, and disabled states
- [ ] Answer option buttons have correct (green) and incorrect (red) feedback states
- [ ] The audio progress bar is styled
- [ ] A reusable loading spinner component is styled and used across screens
- [ ] Layout is fully responsive on mobile screen sizes (360px+)
- [ ] Subtle transitions and animations are used between screen changes

---

## 8. Error Handling & Edge Cases

### 16. Robustness & Error Handling

#### Description

Ensuring the app behaves gracefully under failure conditions — API errors, missing data, expired tokens, and unexpected user behaviour — so that the experience is never broken.

#### Acceptance Criteria

- [ ] No internet connection shows a friendly offline message
- [ ] Spotify API being unavailable shows a retry option
- [ ] Artists or genres that return zero playable tracks prompt the user to try another selection
- [ ] Token expiry mid-game silently refreshes without interrupting gameplay
- [ ] Browser back navigation is handled by the router to prevent broken state
- [ ] Page refresh mid-game either restores state or gracefully restarts from the landing screen

---

## 9. Documentation

### 17. Project Documentation

#### Description

Clear, maintained documentation that explains the project setup, the screen flow, and any important API notes so the codebase is easy to understand and revisit.

#### Acceptance Criteria

- [ ] `docs/api-notes.md` covers every Spotify endpoint used, expected response shapes, and known limitations (e.g. missing previews)
- [ ] `docs/screen-flow.md` describes every screen and the navigation paths between them
- [ ] `README.md` includes setup instructions, how to run locally, and how to configure the Client ID
- [ ] Inline comments in `authPkce.js` explain each step of the PKCE flow

---
