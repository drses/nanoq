(function (global) {
  'use strict';

  // There is no back-pressure

  const PortStream = (port, origin) => {
    const pipe = AsyncPipe()

    // Adapt the sender side
    let send
    if (port.postMessage) {
      // DOM message ports
      send = (message) => port.postMessage(message, origin);
    } else if (port.send) {
      if (port.on) {
        // Node.js event streams
        send = (message) => port.send(message);
      } else {
        // WebSockets have a "send" method, indicating
        // that we cannot send until the connection has
        // opened.  We change the send method into a
        // promise for the send method, resolved after
        // the connection opens, rejected if it closes
        // before it opens.
        const ready = new Promise((resolve, reject) => {
          port.addEventListener('open', () => resolve());
        })
        send = (message) => ready.then(() => port.send(message));
      }
    } else {
      throw new Error('unable to adapt port to stream');
    }

    const onMessage = (event) => pipe.out.next(event.data);
    const onError = (event) => pipe.out.throw(event);
    const onClose = (event) => pipe.out.return();

    // Adapt the receiver side
    if (port.on) {
      // Node.js style
      port.on('message', pipe.out.next);
      port.on('close', pipe.out.return);
      port.on('error', pipe.out.throw);
    } else if (port.onMessage) {
      // Chrome extension message ports
      port.onMessage.addListener(pipe.out.next);
      // There are no close or error events for Chrome extensions.
    } else if (port.addEventListener) {
      // DOM
      port.addEventListener('message', onMessage);
      port.addEventListener('close', onClose);
      port.addEventListener('error', onError);
    } else {
      // WebSockets and WebWorkers
      port.onmessage = onMessage;
    }

    return {
      out: {
        next(value) {
          send(value);
        },
        return(value) {
          if (port.close) {
            port.close()
          }
        },
        throw(error) {
          if (port.close) {
            port.close()
          }
        }
      },
      in: pipe.in,
    };

  };

  global.PortStream = PortStream;

})(this)
