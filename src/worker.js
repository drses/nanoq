'use strict';

self.importScripts(
  'nanoq.js',
  'miniq.js',
  'async-queue.js',
  'async-stream.js',
  'adapt-stream.js',
)

const s = WebWorkerStream(self)
s.in.map(
  (number) => number * 10,
  null,
  3
)
.to(s.out)
