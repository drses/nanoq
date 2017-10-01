(function (global) {
  'use strict';

  const discard = {
    get() {
      return Promise.resolve();
    },
    put() {
    },
  };

  const WebWorkerStream = (port) => {
    const queue = AsyncQueue();

    port.onmessage = (event) => queue.put(event.data);

    return {
      out: {
        next(value) {
          port.postMessage(Iteration(value, false));
        },
        return(value) {
          port.postMessage(Iteration(value, true));
        },
        throw(error) {
          port.terminate();
        }
      },
      in: Stream(discard, queue),
    };

  };

  global.WebWorkerStream = WebWorkerStream;

})(this)
