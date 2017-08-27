(function () {
  'use strict';

  Object.defineProperties(Promise, Object.getOwnPropertyDescriptors({
    defer() {
      let resolve, reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      })
      return {promise, resolve, reject};
    }
  }));

})();
