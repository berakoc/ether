const {} = require('ramda');

const initWindowEtherProps = (props) => {
  const propKeys = Object.keys(props);
  propKeys.forEach((key) => (window[key] = props[key]));
};

module.exports = {
  initWindowEtherProps,
};
