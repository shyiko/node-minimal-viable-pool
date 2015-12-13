# node-minimal-viable-pool

Minimal viable pool for Node.js.

> Depending on the version of Node.js you may or may not need to use `--harmony` flag (implementation depends on 
[Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)). 

## Installation

```sh
npm install minimal-viable-pool
```

## API

```typescript
interface Pool<T> {
  /**
   * `acquireTimeout` - amount of time `acquire(..)` should wait for the resource 
   * to become available before bailing out (with an error). There is no limit by default.  
   */
  new (options?: {acquireTimeout?: number});
  /**
   * Adds resource to the pool. 
   */
  add(resource: T): boolean;
  /**
   * Removes resource from the pool.
   */ 
  remove(resource: T): boolean;
  /**
   * Tries to obtain resource from the pool within `acquireTimeout`. If successful -
   * executes callback(null, resource), otherwise - callback(err). 
   */
  acquire(callback: (err?: Error, resource?: T) => void): void;
  /**
   * Returns `resource` back to the pool making it available for `acquire` (unless
   * same resource was already `remove`d in which case it does nothing).
   */
  release(resource: T): void;
  /**
   * The number of times `acquire(..)` can be executed before hitting `wait queue`. 
   * In other words, number of resources "not in use".
   */
  available: number;
  /**
   * Total number of resources that are managed by the pool.
   */
  size: number;
}
```

## Usage

```sh
var server = ... 
var io = ...
var Pool = require('pool');

var poolOfSockets = new Pool({acquireTimeout: 30000});

io.on('connection', (socket) { 
  poolOfSockets.add(socket);
  socket.on('disconnect', function () { poolOfSockets.remove(socket); });
});

server.get('/', function (req, res, next) {
  poolOfSockets.acquire(function (err, socket) {
    if (err) {
      return next(err);
    }
    // in case we don't hear back from the worker within a reasonable time
    var timeout = setTimeout(function () {
      poolOfSockets.release(socket);
      socket.removeListener('job-completed', onJobCompleted);
      next(new Error('Timed out waiting for the job to finish'));
    }, TIMEOUT);    
    
    function onJobCompleted(result) {
      poolOfSockets.release(socket);
      clearTimeout(timeout);
      res.json(result);            
    };
    
    socket.once('job-completed', onJobCompleted);
    socket.emit('start-job');
  });
});
```

## License

[MIT License](https://github.com/shyiko/node-minimal-viable-pool/blob/master/mit.license)
