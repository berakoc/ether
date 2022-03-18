const R = require('ramda');

const withChangeDetection =
  (updateValue, getState, setEtherUpdater) => (key, ether) => {
    const state = getState(key);
    const value = ether['value'];
    if (R.isNil(state)) {
      updateValue(key, ether);
      return;
    }
    const previousValue = R.prop('value', state);
    const shouldUpdate = R.not(R.equals(value, previousValue));
    if (shouldUpdate) {
      updateValue(key, ether);
    }
    setEtherUpdater(key, shouldUpdate);
  };

module.exports = {
  withChangeDetection,
};
