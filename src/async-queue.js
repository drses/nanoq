(function (global) {
  'use strict';

  const AsyncQueue = () => {
    let ends = Promise.defer();
    return {
      put(value) {
        const next = Promise.defer();
        ends.resolve({
          head: value,
          tail: next.promise,
        })
        ends.resolve = next.resolve;
        ends.reject = next.reject;
      },
      get() {
        const result = ends.promise.get('head')
        ends.promise = ends.promise.get('tail')
        return result
      }
    }
  }

  global.AsyncQueue = AsyncQueue
})(this);
