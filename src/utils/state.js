const createState = (initialState = {}) => {
  let state = initialState;

  const getState = (key) => (key ? state[key] : state);
  const setState = (newState) => (state = { ...state, ...newState });
  const setStateWithKey = (key, value) => (state = { ...state, [key]: value });

  return [getState, setState, setStateWithKey];
};

module.exports = {
  createState,
};
