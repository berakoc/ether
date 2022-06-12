const { setComponentIdThenReturn } = require('./common');
const { getAttributeValue } = require('./dom');

const detectCompound = (etherNode) => {
  const compound = getAttributeValue(etherNode, 'compound');
  if (compound) {
    setComponentIdThenReturn(etherNode, 'compound-id');
    etherNode.removeAttribute('compound');
  }
  return compound;
};

const renderCompounds = (etherChildren, getEtherTree, compounds) => {
  etherChildren.forEach((etherChild) => {
    const compoundArtifact = detectCompound(etherChild);
    if (compoundArtifact) {
      const injectId = etherChild.getAttribute('inject-id');
      const deps = Object.keys(getEtherTree()).filter((key) =>
        getEtherTree()
          [key].children.map((child) => child.injectId)
          .includes(injectId)
      );
      Object.keys(getEtherTree()).forEach((etherKey) => {
        const ether = getEtherTree()[etherKey];
        ether.children.forEach((child) => {
          if (child.injectId === injectId) {
            const initialRenderMethod = child.render;
            const childNode = child.node;
            child.render = () => {
              const initialRenderTemplate = initialRenderMethod();
              childNode.innerHTML = initialRenderTemplate.replace(
                new RegExp(`\\#${compoundArtifact[0]}`, 'g'),
                compounds[compoundArtifact[1]](
                  ...deps.map((dep) => getEtherTree()[dep].value)
                )
              );
            };
          }
        });
      });
    }
  });
};

module.exports = renderCompounds;
