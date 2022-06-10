const getUUID = require('../utils/getUUID');

const initWindowEtherProps = (props) => {
  const propKeys = Object.keys(props);
  propKeys.forEach((key) => (window[key] = props[key]));
};

const setComponentIdThenReturn = (component, idKey) => {
  const id = getUUID();
  component.setAttribute(idKey, id);
  return id;
};

module.exports = {
  initWindowEtherProps,
  setComponentIdThenReturn,
};
