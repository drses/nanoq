(function(global) {
  "use strict";

  // localRelay is not a real relay because of the absence of AWAIT_FAR
  const localRelay = {
    GET(p, key) { return p.then(o => o[key]); },
    PUT(p, key, val) { return p.then(o => o[key] = val); },
    DEL(p, key) { return p.then(o => delete o[key]); },
    POST(p, key, args) { return p.then(o => o[key](...args)); },
    FAPPLY(p, args) { return p.then(o => o(...args)); }
  };
  
  const relayToPromise = new WeakMap();
  
  const promiseToRelay = new WeakMap();
  
  function registerRemote(relay) {
    const promise = Promise.resolve(relay.AWAIT_FAR());
    relayToPromise.set(relay, promise);
    promiseToRelay.set(promise, relay);
  }
  
  function registerFar(relay) {
    const promise = Promise.resolve(relay);
    relayToPromise.set(relay, promise);
    promiseToRelay.set(promise, relay);
  }  
  
  function relay(p) {
    return promiseToRelay.get(p) || localRelay;
  }
  
  function Q(specimen) {
    return relayToPromise.get(specimen) || Promise.resolve(specimen);
  }
  
  Q.__proto__ = Promise;
  
  Object.defineProperties(Promise.prototype, Object.getOwnPropertyDescriptors({
    get(key) { return relay(this).GET(this, key); },
    put(key, val) { return relay(this).PUT(this, key, val); },
    del(key) { return relay(this).DEL(this, key); },
    post(key, args) { return relay(this).POST(this, key, args); },
    invoke(key, ...args) { return relay(this).POST(this, key, args); },
    fapply(args) { return relay(this).FAPPLY(this, args); },
    fcall(...args) { return relay(this).FAPPLY(this, args); }
  }));

  global.Q = Q;
  global.registerRemote = registerRemote;
  global.registerFar = registerFar;
  
})(this);
