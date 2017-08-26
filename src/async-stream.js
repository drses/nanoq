(function (global) {
  'use strict';

  const Iteration = (value, done) => {
    return {value, done};
  }

  global.Iteration = Iteration;

  const Stream = (syn, ack) => {
    return {
      __proto__: Stream.prototype,
      next(value) {
        ack.put(Iteration(value, false))
        return syn.get();
      },
      return(value) {
        ack.put(Iteration(value, true))
        return syn.get();
      },
      throw(error) {
        ack.put(Promise.reject(error))
        return syn.get();
      },
    }
  }

  Stream.prototype = {
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
        start()
        Promise.resolve()
          .then(() => stream.next(iteration.value))
          .then(finish)
      })
      return stream;
    },
    through(pipe) {
      this.to(pipe.out);
      return pipe.in;
    },
  }

  Stream.null = {
    next() {},
    return() {},
    throw() {},
  }

  Stream.from = (iterable) => {
    const pipe = AsyncPipe()
    for (const value of iterable) {
      pipe.out.next(value);
    }
    pipe.out.return()
    return pipe.in;
  }

  global.Stream = Stream;

  const AsyncPipe = () => {
    const from = AsyncQueue();
    const to = AsyncQueue();
    return {
      in: Stream(from, to),
      out: Stream(to, from),
    };
  };

  global.AsyncPipe = AsyncPipe;
})(this);
