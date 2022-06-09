const createState = (initialState = {}) => {
  let state = initialState;

  const getState = (key) => (key ? state[key] : state);
  const setState = (newState) => (state = { ...state, ...newState });

  return [getState, setState];
};

module.exports = {
  createState,
};
