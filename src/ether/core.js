const getUUID = require('../utils/getUUID');
const { withChangeDetection } = require('./detector');
const {
  getAttributeValue,
  removeAttributes,
  selectAllByAttr,
  selectAll,
} = require('./dom');
const { replaceEtherKeysWithValues } = require('./parser');

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
const setComponentIdThenReturn = (component, idKey) => {
  const id = getUUID();
  component.setAttribute(idKey, id);
  return id;
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
const getEtherChildren = (component, etherKey) => {
  const childrenNodes = selectAll(`[inject*="${etherKey}"]`, component);
  const children = Array.from(childrenNodes).map((child) => {
    const previousInjectId = child.getAttribute('inject-id');
    const injectId =
      previousInjectId || setComponentIdThenReturn(child, 'inject-id');
    const initialRenderTemplate = child.innerHTML;
    const render = () => {
      // TODO Add a signal for handling only in need of update for multiple intervened states
      child.innerHTML = replaceEtherKeysWithValues(
        initialRenderTemplate,
        getEtherValue
      );
    };
    return {
      injectId,
      render,
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

const handleActions = (actions) => {
  const actionComponents = selectAllByAttr('on');
  actionComponents.forEach((component) => {
    const [type, actionName, etherKey] = getAttributeValue(component, 'on');
    component.removeAttribute('on');
    setComponentIdThenReturn(component, 'action-id');
    const [select, update] = buildSelector(etherKey);
    component.addEventListener(type, () => {
      actions[actionName](select, update, getEther, setEther);
      const shouldUpdateEther = getShouldUpdateEther(etherKey);
      shouldUpdateEther && renderEther(etherKey);
    });
  });
};

const renderEther = (etherKey) => {
  const ether = getEther(etherKey);
  ether.update();
};

const initializeEtherCore = ({ actions }) => {
  const etherComponents = getEtherComponents();
  etherComponents.forEach(constructEther);
  clearEtherChildren();
  handleActions(actions);
  Object.keys(getEtherTree()).forEach(renderEther);
};

module.exports = {
  initializeEtherCore,
  getEtherTree,
};
