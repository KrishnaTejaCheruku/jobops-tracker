(function (global) {
  const rawAPI = global.browser || global.chrome;
  const usesPromiseAPI = Boolean(global.browser && rawAPI === global.browser);

  function requireAPI(path, value) {
    if (!value) {
      throw new Error(`Extension API unavailable: ${path}`);
    }

    return value;
  }

  function readLastError() {
    const lastError = rawAPI && rawAPI.runtime && rawAPI.runtime.lastError;
    if (!lastError) {
      return null;
    }

    return new Error(lastError.message || String(lastError));
  }

  function callAPI(target, method, ...args) {
    requireAPI(method, target && target[method]);

    if (usesPromiseAPI) {
      return Promise.resolve(target[method](...args));
    }

    return new Promise((resolve, reject) => {
      target[method](...args, (result) => {
        const error = readLastError();
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  function apiRoot() {
    return requireAPI("chrome/browser", rawAPI);
  }

  global.jobOpsExtension = {
    storageGet(defaults) {
      const api = apiRoot();
      return callAPI(api.storage.sync, "get", defaults);
    },

    storageSet(values) {
      const api = apiRoot();
      return callAPI(api.storage.sync, "set", values);
    },

    tabsQuery(query) {
      const api = apiRoot();
      return callAPI(api.tabs, "query", query);
    },

    tabsCreate(createProperties) {
      const api = apiRoot();
      return callAPI(api.tabs, "create", createProperties);
    },

    captureVisibleTab(windowId, options) {
      const api = apiRoot();
      return callAPI(api.tabs, "captureVisibleTab", windowId, options);
    },

    executeScript(details) {
      const api = apiRoot();
      return callAPI(api.scripting, "executeScript", details);
    },
  };
})(globalThis);
