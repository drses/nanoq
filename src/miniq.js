(function () {
  'use strict';

  Promise.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  Promise.defer = () => {
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    })
    return {promise, resolve, reject};
  };

})();
