(function (global) {
  'use strict';

  const Iteration = (value, done) => ({value, done});

  global.Iteration = Iteration;

  const Stream = function (syn, ack) {
    return {
      __proto__: Stream.prototype,
      next(value) {
        syn.put(Iteration(value, false))
        return ack.get();
      },
      return(value) {
        syn.put(Iteration(value, true))
        return ack.get();
      },
      throw(error) {
        syn.put(Promise.reject(error))
        return ack.get();
      },
    }
  };

  Object.defineProperties(Stream.prototype, Object.getOwnPropertyDescriptors({
    do(callback, thisp, limit) {
      const sem = AsyncQueue()
      limit = Math.max(1, limit|0)
      while (limit--) {
        sem.put()
      }
      const get = () => {
        return sem.get().then(() => {
          return this.next().then((iteration) => {
            return Promise.resolve()
              .then(() => callback.call(thisp, iteration, get, sem.put))
          })
        })
      }
      get()
    },
    map(callback, thisp, limit) {
      const pipe = AsyncPipe();
      this.do((iteration, start, finish) => {
        if (iteration.done) {
          pipe.out.return(iteration.value);
          return
        }
        start()
        return Promise.resolve()
          .then(() => callback.call(thisp, iteration.value))
          .then(
            async (value) => (await pipe.out.next(value), finish()),
            async (error) => pipe.out.throw(error)
          );
      }, null, limit);
      return pipe.in;
    },
    forEach(callback, thisp, limit) {
      const res = Promise.defer()
      this.do((iteration, start, finish) => {
        if (iteration.done) {
          res.resolve(iteration.value)
          return
        }
        start()
        return Promise.resolve()
          .then(() => callback.call(thisp, iteration.value))
          .then(finish, (error) => {
            res.reject(error);
          })
      }, null, limit);
      return res.promise;
    },
    to(stream) {
      this.do((iteration, start, finish) => {
        if (iteration.done) {
          stream.return(iteration.value);
          return
        }
        Promise.resolve()
          .then(() => stream.next(iteration.value))
          .then(() => (start(), finish()))
      });
    },
    through(pipe) {
      this.to(pipe.out);
      return pipe.in;
    },
  }));

  Object.defineProperties(Stream, Object.getOwnPropertyDescriptors({
    null: {
      next() {},
      return() {},
      throw() {},
    },
    from(iterable, result) {
      const pipe = AsyncPipe('Stream.from')
      for (const value of iterable) {
        pipe.out.next(value);
      }
      pipe.out.return(result);
      return pipe.in;
    },
  }));

  global.Stream = Stream;

  const AsyncPipe = () => {
    const from = AsyncQueue();
    const to = AsyncQueue();
    return {
      out: Stream(to, from),
      in: Stream(from, to),
    };
  };

  global.AsyncPipe = AsyncPipe;

})(this);
