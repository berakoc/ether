const { merge } = require('lodash');
const { pipe } = require('ramda');
const { setComponentIdThenReturn } = require('./common');
const renderCompounds = require('./compound');
const { inputNodeNames } = require('./constants');
const { withChangeDetection } = require('./detector');
const {
  getAttributeValue,
  removeAttributes,
  selectAllByAttr,
  selectAll,
} = require('./dom');
const { defaultOptions } = require('./inject');
const { handleInputBindings } = require('./input');
const { replaceEtherKeysWithValues } = require('./parser');
const { handleApiRequests } = require('./request');

const [getEtherUpdaterTree, getEtherUpdater, setEtherUpdater] = (() => {
  let updater = {};
  return [
    () => updater,
    (key) => updater[key],
    (key, value) => (updater = { ...updater, [key]: value }),
  ];
})();

const getEtherValue = (etherKey) => getEther(etherKey).value;

const [getEtherTree, getEther, setEther] = (() => {
  let etherTree = {};
  const getEtherTree = () => etherTree;
  const getEther = (key) => etherTree[key];
  const setEther = (key, value) => (etherTree = { ...etherTree, [key]: value });
  return [
    getEtherTree,
    getEther,
    withChangeDetection(setEther, getEther, setEtherUpdater),
  ];
})();

const buildSelector = (etherKey) => [
  () => getEther(etherKey).value,
  (value) =>
    setEther(etherKey, {
      ...getEther(etherKey),
      value,
    }),
];

const getEtherComponents = () => selectAllByAttr('ether');
const clearEtherComponent = (component) => {
  removeAttributes(component, ['ether', 'init']);
};

const getEtherComponentProps = (component) => {
  const etherKey = component.getAttribute('ether');
  const initialValue = getAttributeValue(component, 'init');
  return [etherKey, initialValue];
};

const clearEtherChildren = () => {
  const removeInject = (child) => removeAttributes(child, ['inject']);
  selectAllByAttr('inject').forEach(removeInject);
};

const getProcessedEtherChildren = () => selectAllByAttr('inject-id');

const getEtherChildren = (component, etherKey) => {
  const childrenNodes = selectAll(`[inject*="${etherKey}"]`, component);
  const children = Array.from(childrenNodes).map((child) => {
    const previousInjectId = child.getAttribute('inject-id');
    const injectId =
      previousInjectId || setComponentIdThenReturn(child, 'inject-id');
    const initialRenderTemplate = child.innerHTML;
    const render = () => {
      // TODO Add a signal for handling only in need of update for multiple intervened states
      const renderedTemplateWithEtherAtoms = replaceEtherKeysWithValues(
        initialRenderTemplate,
        getEtherValue
      );
      child.innerHTML = renderedTemplateWithEtherAtoms;
      return renderedTemplateWithEtherAtoms;
    };
    return {
      injectId,
      render,
      node: child,
    };
  });

  return children;
};

const constructEther = (component) => {
  const etherId = setComponentIdThenReturn(component, 'ether-id');
  const [etherKey, initialValue] = getEtherComponentProps(component);
  clearEtherComponent(component);
  const children = getEtherChildren(component, etherKey);
  setEtherUpdater(etherKey, false);
  setEther(etherKey, {
    value: initialValue,
    initialValue,
    etherId,
    update() {
      this.children.forEach((child) => child.render());
    },
    children,
  });
};

const getShouldUpdateEther = (etherKey) => getEtherUpdater(etherKey);

const renderEther = (etherKey) => {
  const ether = getEther(etherKey);
  ether.update();
};

const handleActions = (actions) => {
  const actionComponents = selectAllByAttr('on');
  actionComponents.forEach((component) => {
    const [type, actionName, etherKey] = getAttributeValue(component, 'on');
    component.removeAttribute('on');
    setComponentIdThenReturn(component, 'action-id');
    const [select, update] = buildSelector(etherKey);
    const isInput = inputNodeNames.includes(component.nodeName);
    component.addEventListener(type, (event) => {
      if (isInput) {
        actions[actionName](
          event.target.value,
          select,
          update,
          getEther,
          setEther
        );
      } else {
        actions[actionName](select, update, getEther, setEther);
      }
      const shouldUpdateEther = getShouldUpdateEther(etherKey);
      shouldUpdateEther && renderEther(etherKey);
    });
  });
};

const useUpdateEnhancers = (enhancers, ethers) => {
  for (const etherKey in ethers) {
    ethers[etherKey]['update'] = pipe(
      ...enhancers.map((enhancer) => enhancer.bind(null, etherKey))
    )(ethers[etherKey]['update'].bind(ethers[etherKey]));
  }
};

const initializeEtherCore = ({
  actions,
  requests,
  options,
  dataMethods,
  compounds,
}) => {
  const enhancedOptions = merge(defaultOptions, options);
  const etherComponents = getEtherComponents();
  etherComponents.forEach(constructEther);
  renderCompounds(getProcessedEtherChildren(), getEtherTree, compounds);
  clearEtherChildren();
  const enhanceUpdateWithInputBindings = handleInputBindings(getEther);
  handleActions(actions);
  const enhanceUpdateWithRequest = handleApiRequests(
    requests,
    getEther,
    enhancedOptions.requests,
    dataMethods
  );
  useUpdateEnhancers(
    [enhanceUpdateWithInputBindings, enhanceUpdateWithRequest],
    getEtherTree()
  );
  Object.keys(getEtherTree()).forEach(renderEther);
};

module.exports = {
  initializeEtherCore,
  getEtherTree,
};
