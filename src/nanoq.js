(function(global) {
  "use strict";

  // A remoteRelay must additionally have an AWAIT_FAR method
  const localRelay = {
    GET(p, key) { return p.then(o => o[key]); },
    PUT(p, key, val) { return p.then(o => o[key] = val); },
    DEL(p, key) { return p.then(o => delete o[key]); },
    POST(p, key, args) { return p.then(o => o[key](...args)); },
    FAPPLY(p, args) { return p.then(o => o(...args)); }
  };
  
  const relayToPromise = new WeakMap();
  const promiseToRelay = new WeakMap();
  
  function registerRemote(remoteRelay) {
    const promise = Promise.resolve(remoteRelay.AWAIT_FAR());
    relayToPromise.set(remoteRelay, promise);
    promiseToRelay.set(promise, remoteRelay);
  }
  
  function registerFar(farRelay) {
    const promise = Promise.resolve(farRelay);
    relayToPromise.set(farRelay, promise);
    promiseToRelay.set(promise, farRelay);
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

  const passByCopyRecords = new WeakSet();

  Object.defineProperties(Q, Object.getOwnPropertyDescriptors({
    join(p, q) {
      if (Object.is(p, q)) {
        // When p is a pipeline-able promise, this shortcut preserves
        // pipelining.
        return p;
      }
      return Promise.all([p, q]).then(([pp, qq]) => {
        if (Object.is(pp, qq)) {
          return pp;
        } else {
          throw new RangeError("not the same");
        }
      });
    },
    passByCopy(record) {
      if (passByCopyRecords.has(record)) { return record; }
      if (Object.isFrozen(record)) {
        throw new TypeError(`already frozen`);
      }
      Object.freeze(record);
      if (!Object.isFrozen(record)) {
        throw new TypeError(`failed to freeze`);
      }
      passByCopyRecords.add(record);
      return record;
    },
    isPassByCopy(record) {
      return passByCopyRecords.has(record);
    }
  }));

  global.Q = Q;
  global.registerRemote = registerRemote;
  global.registerFar = registerFar;
  
})(this);
