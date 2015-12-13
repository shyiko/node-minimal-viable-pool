function Pool (o) {
  this.acquireTimeout = o && o.acquireTimeout || Number.MAX_VALUE;
  this.resources = new Set();
  this.acquiredResources = new Set();
  this.waitQueue = [];
}

Pool.prototype.add = function (resource) {
  return !this.resources.has(resource) && !this.acquiredResources.has(resource) &&
    (push.call(this, resource), true);
};

Pool.prototype.remove = function (resource) {
  return this.resources.delete(resource) ||
    this.acquiredResources.delete(resource);
};

/**
 * @param cb(err, resource)
 */
Pool.prototype.acquire = function (cb) {
  var resource = this.resources.values().next().value;
  if (resource) {
    this.resources.delete(resource);
    this.acquiredResources.add(resource);
    return process.nextTick(cb.bind(null, null, resource));
  }
  var e = {cb: cb};
  e.timeoutId = setTimeout(function () {
    this.waitQueue.splice(this.waitQueue.indexOf(e), 1);
    cb(new Error('Timed out waiting for the resource'));
  }.bind(this), this.acquireTimeout);
  this.waitQueue.push(e);
};

Pool.prototype.release = function (resource) {
  this.acquiredResources.delete(resource) && push.call(this, resource);
};

Object.defineProperty(Pool.prototype, 'available', {
  get: function () {
    return this.resources.size;
  }
});

Object.defineProperty(Pool.prototype, 'size', {
  get: function () {
    return this.resources.size + this.acquiredResources.size;
  }
});

function push (resource) {
  if (this.waitQueue.length) {
    var e = this.waitQueue.shift();
    clearTimeout(e.timeoutId);
    this.acquiredResources.add(resource);
    process.nextTick(e.cb.bind(null, null, resource));
  } else {
    this.resources.add(resource);
  }
}

module.exports = Pool;
