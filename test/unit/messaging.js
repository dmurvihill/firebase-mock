'use strict';

var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Messaging = require('../../').MockMessaging;

describe('MockMessaging', function() {

  var messaging;
  beforeEach(function() {
    messaging = new Messaging();
  });

  describe('#flush', function() {
    it('flushes the queue and returns itself', function() {
      sinon.stub(messaging.queue, 'flush');
      expect(messaging.flush(10)).to.equal(messaging);
      expect(messaging.queue.flush).to.have.been.calledWith(10);
    });
  });

  describe('#autoFlush', function() {
    it('enables autoflush with no args', function() {
      messaging.autoFlush();
      expect(messaging.flushDelay).to.equal(true);
    });

    it('can specify a flush delay', function() {
      messaging.autoFlush(10);
      expect(messaging.flushDelay).to.equal(10);
    });

    it('returns itself', function() {
      expect(messaging.autoFlush()).to.equal(messaging);
    });
  });

  describe('#on', function() {
    it('throws if callback is not a function', function() {
      expect(function() {
        messaging.on('send', 'not a function');
      }).to.throw();
    });

    it('registers a callback', function() {
      var callback = function() {};
      messaging.on('send', callback);
      expect(messaging.callbacks.send).to.be.eql(callback);
    });
  });

  describe('#send', function() {
    it('should check that message is not undefined', function() {
      expect(function() {
        messaging.send();
      }).to.throw();
    });

    it('should return thenable reference', function(done) {
      var thenable = messaging.send({
        message: 'foo'
      });
      thenable.then(function(result) {
        expect(result).to.be.a('string');
        done();
      }, done).catch(function(err) {
        done(err);
      });
      messaging.flush();
    });

    it('can simulate an error', function(done) {
      var err = new Error();
      messaging.failNext('send', err);
      var thenable = messaging.send({message: 'foo'});
      messaging.flush();
      thenable.then(function() {
        done('send() should not resolve');
      }).catch(function() {
        done();
      });
    });

    it('can return user defined results', function(done) {
      messaging.respondNext('send', 'the result');
      var thenable = messaging.send({message: 'foo'});
      messaging.flush();
      thenable.then(function(result) {
        expect(result).to.equal('the result');
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('invokes callback with args', function(done) {
      var message = {
        message: 'foo'
      };
      messaging.on('send', function(args) {
        expect(args).to.have.lengthOf(1);
        expect(args[0]).to.be.eql(message);
        done();
      });
      messaging.send(message);
      messaging.flush();
    });
  });

  describe('#sendAll', function() {
    it('should check that messages is an array', function() {
      expect(function() {
        messaging.sendAll('not an array');
      }).to.throw();
    });

    it('should return thenable reference', function(done) {
      var thenable = messaging.sendAll([{message: 'foobar'}]);
      thenable.then(function(result) {
        expect(result).to.be.not.undefined; // jshint ignore:line
        expect(result).to.be.not.null; // jshint ignore:line
        expect(result.failureCount).to.be.eql(0);
        expect(result.successCount).to.be.eql(1);
        expect(result.responses).to.be.an('array');
        expect(result.responses).to.have.lengthOf(1);
        expect(result.responses[0].error).to.be.undefined; // jshint ignore:line
        expect(result.responses[0].messageId).to.be.a('string');
        expect(result.responses[0].success).to.be.true; // jshint ignore:line
        done();
      }, done).catch(function(err) {
        done(err);
      });
      messaging.flush();
    });

    it('can simulate an error', function(done) {
      var err = new Error();
      messaging.failNext('sendAll', err);
      var thenable = messaging.sendAll([{message: 'foobar'}]);
      messaging.flush();
      thenable.then(function() {
        done('sendAll() should not resolve');
      }).catch(function() {
        done();
      });
    });

    it('can return user defined results', function(done) {
      messaging.respondNext('sendAll', 'the result');
      var thenable = messaging.sendAll([{message: 'foobar'}]);
      messaging.flush();
      thenable.then(function(result) {
        expect(result).to.equal('the result');
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('invokes callback with args', function(done) {
      var message = [{message: 'foobar'}];
      messaging.on('sendAll', function(args) {
        expect(args).to.have.lengthOf(1);
        expect(args[0]).to.be.eql(message);
        done();
      });
      messaging.sendAll(message);
      messaging.flush();
    });
  });

  describe('#sendMulticast', function() {
    it('should check that message is not undefined', function() {
      expect(function() {
        messaging.sendMulticast();
      }).to.throw();
    });

    it('should check that message contains a "tokens" array', function() {
      expect(function() {
        messaging.sendMulticast({message: 'foobar'});
      }).to.throw();
    });

    it('should return thenable reference', function(done) {
      var thenable = messaging.sendMulticast({message: 'foobar', tokens: ['t1', 't2']});
      thenable.then(function(result) {
        expect(result).to.be.not.undefined; // jshint ignore:line
        expect(result).to.be.not.null; // jshint ignore:line
        expect(result.failureCount).to.be.eql(0);
        expect(result.successCount).to.be.eql(2);
        expect(result.responses).to.be.an('array');
        expect(result.responses).to.have.lengthOf(2);
        expect(result.responses[0].error).to.be.undefined; // jshint ignore:line
        expect(result.responses[0].messageId).to.be.a('string');
        expect(result.responses[0].success).to.be.true; // jshint ignore:line
        expect(result.responses[1].error).to.be.undefined; // jshint ignore:line
        expect(result.responses[1].messageId).to.be.a('string');
        expect(result.responses[1].success).to.be.true; // jshint ignore:line
        done();
      }, done).catch(function(err) {
        done(err);
      });
      messaging.flush();
    });

    it('can simulate an error', function(done) {
      var err = new Error();
      messaging.failNext('sendMulticast', err);
      var thenable = messaging.sendMulticast({message: 'foobar', tokens: ['t1']});
      messaging.flush();
      thenable.then(function() {
        done('sendMulticast() should not resolve');
      }).catch(function() {
        done();
      });
    });

    it('can return user defined results', function(done) {
      messaging.respondNext('sendMulticast', 'the result');
      var thenable = messaging.sendMulticast({message: 'foobar', tokens: ['t1']});
      messaging.flush();
      thenable.then(function(result) {
        expect(result).to.equal('the result');
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('invokes callback with args', function(done) {
      var message = {message: 'foobar', tokens: ['t1']};
      messaging.on('sendMulticast', function(args) {
        expect(args).to.have.lengthOf(1);
        expect(args[0]).to.be.eql(message);
        done();
      });
      messaging.sendMulticast(message);
      messaging.flush();
    });
  });
});
