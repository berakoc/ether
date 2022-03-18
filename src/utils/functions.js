const combineWithSameArg =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn(...args));

module.exports = {
  combineWithSameArg,
};
