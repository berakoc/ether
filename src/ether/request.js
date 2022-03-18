const { get, isUndefined } = require('lodash');
const getUUID = require('../utils/getUUID');
const { createState } = require('../utils/state');
const {
  selectAllByAttr,
  getAttributeValueList,
  removeAttributes,
} = require('./dom');

const [getRequestTree, setRequestTree] = createState();
const [getTemplateMap, setTemplateMap] = createState();

const getRequest = (
  requestKey,
  requestConfig,
  options = {
    shouldUpdateQuery: false,
  }
) => {
  const currentRequestPromise = getRequestTree(requestKey).promise;
  if (isUndefined(currentRequestPromise) || options.shouldUpdateQuery) {
    const combinedRequestConfig = Object.assign({}, requestConfig, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...requestConfig.headers,
      },
    });
    const requestPromise = fetch(requestConfig.url, combinedRequestConfig).then(
      (response) => response.json()
    );
    setRequestTree({
      ...getRequestTree(),
      [requestKey]: { ...getRequestTree(requestKey), promise: requestPromise },
    });
    return requestPromise;
  }
  return currentRequestPromise;
};

const renderRequestComponent = (components, alias, response) => {
  components.forEach((component) => {
    const templateKey = component.getAttribute('fetch-id');
    const template = getTemplateMap(templateKey);
    if (isUndefined(template)) {
      setTemplateMap({
        ...getTemplateMap(),
        [templateKey]: component.innerHTML,
      });
    }
    const componentContent = getTemplateMap(templateKey);
    component.innerHTML = componentContent.replace(
      new RegExp(`\\@${alias}(.[a-zA-Z]+)`, 'g'),
      (_, propPath) => get(response, propPath.split('.').filter(Boolean))
    );
  });
};

const renderRequestByFetchId = (
  requests,
  getEther,
  options = {
    shouldUpdateQuery: false,
    etherKey: '',
  }
) =>
  Object.keys(getRequestTree()).forEach((requestKey) => {
    const { components, alias, dependency } = getRequestTree(requestKey);
    if (options.etherKey === dependency) {
      const requestPromise = getRequest(
        requestKey,
        requests[requestKey](getEther(dependency).value),
        options
      );
      requestPromise.then(renderRequestComponent.bind(null, components, alias));
    }
  });

const initRequestTree = (requestComponents) =>
  requestComponents.forEach((component) => {
    const attributeNameList = ['fetch', 'alias', 'dep'];
    const [requestKey, alias, dependency] = getAttributeValueList(
      component,
      attributeNameList
    );
    removeAttributes(component, attributeNameList);
    component.setAttribute('fetch-id', getUUID());
    const previousComponents = get(
      getRequestTree(requestKey),
      'components',
      []
    );
    setRequestTree({
      ...getRequestTree(),
      [requestKey]: {
        promise: null,
        dependency,
        alias,
        components: previousComponents.concat(component),
      },
    });
  });

const handleApiRequests = (requests, getEther) => {
  const requestComponents = selectAllByAttr('fetch');
  initRequestTree(requestComponents);
  renderRequestByFetchId(requests, getEther);

  const enhanceUpdateWithRequest = (etherKey, updateFunction) => () => {
    renderRequestByFetchId(requests, getEther, {
      shouldUpdateQuery: true,
      etherKey,
    });
    updateFunction();
  };
  return enhanceUpdateWithRequest;
};

module.exports = {
  handleApiRequests,
  getRequestTree,
};
