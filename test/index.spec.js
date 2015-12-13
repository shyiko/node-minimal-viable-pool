var expect = require('chai').expect;
var Pool = require('../src');

describe('Pool', function () {
  describe('#add()', function () {
    it('should increase `size`', function () {
      var pool = new Pool();
      expect(pool.size).to.be.equal(0);
      var resource = {};
      expect(pool.add(resource)).to.be.true;
      expect(pool.size).to.be.equal(1);
      expect(pool.add({})).to.be.true;
      expect(pool.size).to.be.equal(2);
      expect(pool.add(resource)).to.be.false;
      expect(pool.size).to.be.equal(2);
    });
  });
  describe('#remove()', function () {
    it('should decrease `size`', function () {
      var pool = new Pool();
      expect(pool.size).to.be.equal(0);
      expect(pool.remove({})).to.be.false;
      expect(pool.size).to.be.equal(0);
      var resource = {};
      pool.add(resource);
      expect(pool.remove({})).to.be.false;
      expect(pool.size).to.be.equal(1);
      expect(pool.remove(resource)).to.be.true;
      expect(pool.size).to.be.equal(0);
    });
  });
  describe('#acquire()', function () {
    it('should retrieve resource from the pool if available', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      var resource = {};
      pool.add(resource);
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.be.equal(resource);
        done();
      });
    });
    it('should return error if no resource could be acquired within `acquireTimeout`', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.acquire(function (err) {
        expect(err).to.exist;
        expect(pool.available).to.be.equal(0);
        done();
      });
    });
    it('should wait for resource if there are no available', function (done) {
      var pool = new Pool({acquireTimeout: 1000});
      var resource = {};
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        expect(pool.available).to.be.equal(0);
        expect(obj).to.be.equal(resource);
        done();
      });
      pool.add(resource);
    });
    it('should decrease `available` if successful', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      var resource = {};
      pool.add(resource);
      expect(pool.available).to.be.equal(1);
      pool.acquire(function (err) {
        expect(err).to.not.exist;
        expect(pool.available).to.be.equal(0);
        done();
      });
    });
    it('should not decrease `available` if timed out', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.acquire(function (err) {
        expect(err).to.exist;
        expect(pool.available).to.be.equal(0);
        done();
      });
    });
    it('should not timeout on resources that evaluate to false', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.add(0);
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.be.equal(0);
        done();
      });
    });
  });
  describe('#release()', function () {
    it('should release resource back to the pool', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.add({});
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        pool.release(obj);
        pool.acquire(function (err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });
    it('should do nothing if resource was `remove`d before `release`d', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.add({});
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        pool.remove(obj);
        pool.release(obj);
        expect(pool.size).to.be.equal(0);
        expect(pool.available).to.be.equal(0);
        done();
      });
    });
    it('should increment `available` if there are no pending `acquire`s and resource has not been `remove`d', function (done) {
      var pool = new Pool({acquireTimeout: 0});
      pool.add({});
      expect(pool.available).to.be.equal(1);
      pool.acquire(function (err, obj) {
        expect(err).to.not.exist;
        expect(pool.available).to.be.equal(0);
        pool.release(obj);
        expect(pool.available).to.be.equal(1);
        done();
      });
    });
  });
});
