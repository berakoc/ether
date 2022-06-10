const { createState } = require('../utils/state');
const { setComponentIdThenReturn } = require('./common');
const { selectAll, getAttributeValue } = require('./dom');

const [getInputEtherKeyMap, setInputEtherKeyMap] = createState({});

const renderInputComponent = (currentEtherKey, getEther, component) => {
  let inputId = component.getAttribute('input-id');
  if (!inputId) {
    inputId = setComponentIdThenReturn(component, 'input-id');
    setInputEtherKeyMap({
      [inputId]: getAttributeValue(component, 'on')[2],
    });
  }
  const etherKey = getInputEtherKeyMap(inputId);
  if (currentEtherKey !== etherKey) {
    return;
  }
  component.value = getEther(etherKey).value;
};

const handleInputBindings = (getEther) => {
  const etherInputComponents = selectAll('input[on]');
  const render = (currentEtherKey) =>
    etherInputComponents.forEach(
      renderInputComponent.bind(null, currentEtherKey, getEther)
    );
  render(null);
  const enhanceUpdateWithInputBindings =
    (currentEtherKey, updateFunction) => () => {
      render(currentEtherKey);
      updateFunction();
    };
  return enhanceUpdateWithInputBindings;
};

module.exports = {
  handleInputBindings,
};
