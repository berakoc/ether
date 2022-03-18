const { initWindowEtherProps } = require('./common');
const { combineWithSameArg } = require('../utils/functions');
const { getEtherTree, initializeEtherCore } = require('./core');

/**
 * @template V, S
 * @typedef {() => V} Select
 * @typedef {(V) => void} Update
 * @typedef {(K: string) => S} Get
 * @typedef {(K: string, S) => void} Set
 * @typedef {{actions: {[key: string]: (select: Select, update: Update, getState: Get, setState: Set) => void}}} EtherConfig
 */

/**
 * Creates a default EtherConfig object
 * @returns {EtherConfig}
 */
const getDefaultEtherConfig = () => {
  return {
    actions: {},
    requests: {},
  };
};

const [getEtherConfig, setEtherConfig] = (() => {
  let etherConfig = getDefaultEtherConfig();
  return [
    (key) => (key ? etherConfig[key] : etherConfig),
    (newEtherConfig) => {
      etherConfig = newEtherConfig;
    },
  ];
})();

const injectEther = combineWithSameArg(setEtherConfig, initializeEtherCore);

const setEtherWindowArtifacts = () => {
  initWindowEtherProps({
    injectEther,
    getEtherTree: () => Object.assign({}, getEtherTree()),
  });
};

module.exports = {
  getEtherConfig,
  setEtherWindowArtifacts,
};
