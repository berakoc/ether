const {
  get,
  isUndefined,
  isString,
  isNil,
  isEqual,
  identity,
  first,
} = require('lodash');
const getUUID = require('../utils/getUUID');
const { createState } = require('../utils/state');
const {
  selectAllByAttr,
  getAttributeValueList,
  removeAttributes,
  getAttributeValue,
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
  if (isNil(currentRequestPromise) || options.shouldUpdateQuery) {
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

const renderRequestComponent = (
  options = {
    components,
    alias,
    requestConfig,
    dataMethods,
    updateCache,
    isCachedResponse: false,
  },
  response
) => {
  if (!options.isCachedResponse) {
    options.updateCache(options.requestConfig, response);
  }
  options.components.forEach((component) => {
    const templateKey = component.getAttribute('fetch-id');
    const template = getTemplateMap(templateKey);
    if (isUndefined(template)) {
      setTemplateMap({
        ...getTemplateMap(),
        [templateKey]: component.innerHTML,
      });
    }
    const componentContent = getTemplateMap(templateKey);
    const dataMethod = component.getAttribute('data-method');
    component.innerHTML = componentContent.replace(
      new RegExp(`\\@${options.alias}(.[a-zA-Z]+)`, 'g'),
      (_, propPath) =>
        get(
          options.dataMethods,
          dataMethod,
          identity
        )(get(response, propPath.split('.').filter(Boolean)), component)
    );
  });
};

const getResponseFromCache = (cache, requestConfig) =>
  cache.find(({ requestConfig: cachedRequestConfig }) =>
    isEqual(requestConfig, cachedRequestConfig)
  )?.response;

const renderRequestByFetchId = (
  requests,
  getEther,
  dataMethods,
  options = {
    shouldUpdateQuery: false,
    etherKey: '',
    cacheSize: 0,
  }
) =>
  Object.keys(getRequestTree()).forEach((requestKey) => {
    const { components, alias, dependencyList } = getRequestTree(requestKey);
    if (
      dependencyList.includes(options.etherKey) ||
      !options.shouldUpdateQuery
    ) {
      const dependencyValueMap = dependencyList.reduce((acc, etherKey) => {
        const ether = getEther(etherKey);
        return { ...acc, [etherKey]: ether.value };
      }, {});
      const requestConfig = requests[requestKey](dependencyValueMap);
      if (isEqual(requestConfig, getRequestTree(requestKey).config)) {
        return;
      }
      const updateRequestTree = (
        key,
        value,
        updateOptions = {
          isList: false,
        }
      ) =>
        setRequestTree({
          ...getRequestTree(),
          [requestKey]: {
            ...getRequestTree(requestKey),
            [key]: updateOptions.isList
              ? getRequestTree(requestKey)
                  [key].concat(value)
                  .slice(-options.cacheSize)
              : value,
          },
        });
      updateRequestTree('config', requestConfig);
      const cachedResponse = getResponseFromCache(
        getRequestTree(requestKey).cache,
        requestConfig
      );
      const promiseRenderOptions = {
        components,
        alias,
        requestConfig,
        dataMethods,
        updateCache: (requestConfig, response) =>
          updateRequestTree(
            'cache',
            {
              requestConfig,
              response,
            },
            {
              isList: true,
              sizeLimit: options.cacheSize,
            }
          ),
      };
      if (isNil(cachedResponse)) {
        const requestPromise = getRequest(requestKey, requestConfig, options);
        requestPromise.then(
          renderRequestComponent.bind(null, promiseRenderOptions)
        );
      } else {
        renderRequestComponent(
          { ...promiseRenderOptions, isCachedResponse: true },
          cachedResponse
        );
      }
    }
  });

const initRequestTree = (requestComponents) =>
  requestComponents.forEach((component) => {
    const attributeNameList = ['fetch', 'alias', 'dep'];
    const [requestKey, alias, depsArray] = getAttributeValueList(
      component,
      attributeNameList
    );
    removeAttributes(component, attributeNameList);
    component.setAttribute('fetch-id', getUUID());
    const requestObject = getRequestTree(requestKey);
    const previousDepsArray = requestObject?.dependencyList || [];
    const currentDepsArray = []
      .concat(depsArray)
      .concat(previousDepsArray)
      .filter(isString);
    const previousComponents = requestObject?.components || [];
    setRequestTree({
      ...getRequestTree(),
      [requestKey]: {
        promise: null,
        dependencyList: [...new Set(currentDepsArray)],
        alias,
        components: previousComponents.concat(component),
        config: {},
        cache: [],
      },
    });
  });

const handleApiRequests = (
  requests,
  getEther,
  enhancedOptions,
  dataMethods
) => {
  const requestComponents = selectAllByAttr('fetch');
  initRequestTree(requestComponents);
  renderRequestByFetchId(requests, getEther, dataMethods);

  const enhanceUpdateWithRequest = (etherKey, updateFunction) => () => {
    renderRequestByFetchId(requests, getEther, dataMethods, {
      shouldUpdateQuery: true,
      etherKey,
      ...enhancedOptions,
    });
    updateFunction();
  };
  return enhanceUpdateWithRequest;
};

module.exports = {
  handleApiRequests,
  getRequestTree,
};
