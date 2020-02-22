/*
  Mock for admin.messaging.Messaging
  https://firebase.google.com/docs/reference/admin/node/admin.messaging
*/
'use strict';
var _ = require('./lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var Queue = require('./queue').Queue;

function MockMessaging() {
  this.results = {};
  this.callbacks = {};
  this.queue = new Queue();
  this.flushDelay = false;
}

// https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send
MockMessaging.prototype.send = function(message, dryRun) {
  assert(!_.isUndefined(message), 'message must not be undefined');
  return this._send(_.toArray(arguments), 'send', function() {
    var messageId = autoId(new Date().getTime());
    return messageId;
  });
};

// https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-all
MockMessaging.prototype.sendAll = function(messages, dryRun) {
  assert(Array.isArray(messages), 'messages must be an "Array"');
  var self = this;
  return this._send(_.toArray(arguments), 'sendAll', function() {
    return self._mapMessagesToBatchResponse(messages);
  });
};

// https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast
MockMessaging.prototype.sendMulticast = function(multicastMessage, dryRun) {
  assert(!_.isUndefined(multicastMessage), 'multicastMessage must not be undefined');
  assert(Array.isArray(multicastMessage.tokens));
  var self = this;
  return this._send(_.toArray(arguments), 'sendMulticast', function() {
    return self._mapMessagesToBatchResponse(multicastMessage.tokens);
  });
};

MockMessaging.prototype.flush = function(delay) {
  this.queue.flush(delay);
  return this;
};

MockMessaging.prototype.autoFlush = function (delay) {
  if (_.isUndefined(delay)) {
    delay = true;
  }

  this.flushDelay = delay;

  return this;
};

MockMessaging.prototype.failNext = function(methodName, err) {
  assert(_.isString(methodName), 'methodName must be a string');
  assert(err instanceof Error, 'err must be an "Error" object');
  this.results[methodName] = err;
};

MockMessaging.prototype.respondNext = function(methodName, result) {
  assert(_.isString(methodName), 'methodName must be a string');
  assert(!_.isUndefined(result), 'result must not be undefined');
  assert(!(result instanceof Error), 'result must not be an "Error" object');
  this.results[methodName] = result;
};

MockMessaging.prototype.on = function(methodName, callback) {
  assert(_.isString(methodName), 'methodName must be a string');
  assert(_.isFunction(callback), 'callback must be a function');
  this.callbacks[methodName] = callback;
};

MockMessaging.prototype._send = function(args, methodName, defaultResultFn) {
  var result = this._nextResult(methodName);
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer(methodName, args, function () {
      self._invokeOn(methodName, args);

      if (result === null) {
        resolve(defaultResultFn());
      } else if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
};

MockMessaging.prototype._invokeOn = function(methodName, args) {
  var callback = this.callbacks[methodName];
  if (callback) {
    callback(args);
  }
};
  
MockMessaging.prototype._nextResult = function(type) {
  var result = this.results[type];
  delete this.results[type];
  return result || null;
};

MockMessaging.prototype._defer = function(sourceMethod, sourceArgs, callback) {
  this.queue.push({
    fn: callback,
    context: this,
    sourceData: {
      ref: this,
      method: sourceMethod,
      args: sourceArgs
    }
  });
  if (this.flushDelay !== false) {
    this.flush(this.flushDelay);
  }
};

MockMessaging.prototype._mapMessagesToBatchResponse = function(messages) {
  return {
    failureCount: 0,
    successCount: messages.length,
    responses: messages.map(function(message) {
      return {
        error: undefined,
        messageId: autoId(new Date().getTime()),
        success: true,
      };
    })
  };
};

module.exports = MockMessaging;
