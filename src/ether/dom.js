const DOM = {
  selectAll: (selector, context = document) =>
    context.querySelectorAll.call(context, selector),
  selectAllByAttr: (attr, context) => DOM.selectAll(`[${attr}]`, context),
  getAttributeValue: (element, attr) => JSON.parse(element.getAttribute(attr)),
  removeAttributes: (element, attrs) =>
    attrs.forEach((attr) => element.removeAttribute(attr)),
  getAttributeValueList: (element, attrList) =>
    attrList.map((attr) => element.getAttribute(attr)),
};

module.exports = DOM;
