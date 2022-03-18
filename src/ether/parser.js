const parseEtherKeysFromString = (str) => {
  const keys = str.match(/\b$[a-zA-z]+\b/g);
  return keys;
};

// TODO Add a sensor for detecting multiple state changes and only render on change
const replaceEtherKeysWithValues = (str, getEtherValue) =>
  str.replace(/\$([a-zA-Z]+)/g, (_, etherKey) => getEtherValue(etherKey));

module.exports = {
  parseEtherKeysFromString,
  replaceEtherKeysWithValues,
};
