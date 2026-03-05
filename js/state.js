// all modules read from and write to this
const state = {
  // Auth
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
};

// Merges partial updates into state
function setState(updates) {
  Object.assign(state, updates);
}

// Returns a shallow copy of the current state
function getState() {
  return { ...state };
}

export { state, setState, getState };
