'use strict';

self.importScripts(
  'nanoq.js',
  'miniq.js',
  'async-queue.js',
  'async-stream.js',
  'port-stream.js',
)

const s = PortStream(self)
s.in.map(
  async (number) => (
    await Promise.delay(100 - number),
    number * 10
  ),
  null,
  3
).to(s.out);
