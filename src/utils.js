'use strict';

var Snapshot = require('./snapshot');
var Timestamp = require('./timestamp');
var FieldValue = require('./firestore-field-value');
var _ = require('./lodash');

exports.makeRefSnap = function makeRefSnap(ref) {
  return new Snapshot(ref, ref.getData(), ref.priority);
};

exports.mergePaths = function mergePaths(base, add) {
  return base.replace(/\/$/, '') + '/' + add.replace(/^\//, '');
};

exports.cleanData = function cleanData(data) {
  var newData = _.clone(data);
  if (_.isObject(newData)) {
    if (_.has(newData, '.value')) {
      newData = _.clone(newData['.value']);
    }
    if (_.has(newData, '.priority')) {
      delete newData['.priority'];
    }
    if (_.isEmpty(newData)) {
      newData = null;
    }
  }
  return newData;
};

exports.cleanFirestoreData = function cleanFirestoreData(data) {
  var newData = _.clone(data);
  return newData;
};

exports.getMeta = function getMeta(data, key, defaultVal) {
  var val = defaultVal;
  var metaKey = '.' + key;
  if (_.isObject(data) && _.has(data, metaKey)) {
    val = data[metaKey];
    delete data[metaKey];
  }
  return val;
};

exports.assertKey = function assertKey(method, key, argNum) {
  if (!argNum) argNum = 'first';
  if (typeof(key) !== 'string' || key.match(/[.#$\/\[\]]/)) {
    throw new Error(method + ' failed: ' + argNum + ' was an invalid key "' + (key + '') + '. Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
  }
};

exports.priAndKeyComparator = function priAndKeyComparator(testPri, testKey, valPri, valKey) {
  var x = 0;
  if (!_.isUndefined(testPri)) {
    x = exports.priorityComparator(testPri, valPri);
  }
  if (x === 0 && !_.isUndefined(testKey) && testKey !== valKey) {
    x = testKey < valKey ? -1 : 1;
  }
  return x;
};

exports.priorityComparator = function priorityComparator(a, b) {
  // https://firebase.google.com/docs/database/web/lists-of-data#data-order
  if (a !== b) {
    if (a === null || b === null) {
      return a === null ? -1 : 1;
    }
    if(typeof a === 'boolean' && typeof b === 'boolean') {
      return !a ? -1 : 1;
    }
    if (typeof a !== typeof b) {
      if(typeof a === 'boolean' || typeof b === 'boolean') {
        return typeof a === 'boolean' ? -1 : 1;
      }
      return typeof a === 'number' ? -1 : 1;
    }
    return a > b ? 1 : -1;
  }
  return 0;
};

var serverClock, defaultClock;

serverClock = defaultClock = function () {
  return new Date().getTime();
};

exports.getServerTime = function getServerTime() {
  return serverClock();
};

exports.setServerClock = function setServerTime(fn) {
  serverClock = fn;
};

exports.restoreServerClock = function restoreServerTime() {
  serverClock = defaultClock;
};

exports.isServerTimestamp = function isServerTimestamp(data) {
  return _.isObject(data) && data['.sv'] === 'timestamp';
};

exports.removeEmptyRtdbProperties = function removeEmptyRtdbProperties(obj) {
  var t = typeof obj;
  if (t === 'boolean' || t === 'string' || t === 'number' || t === 'undefined') {
    return obj;
  }

  var keys = getKeys(obj);
  if (keys.length === 0) {
    return null;
  } else {
    for (var s in obj) {
      var value = removeEmptyRtdbProperties(obj[s]);
      if (value === null) {
        delete obj[s];
      }
    }
    if (getKeys(obj).length === 0) {
      return null;
    }
  }
  return obj;

  function getKeys(o) {
    var result = [];
    for (var s in o) result.push(s);
    return result;
  }
};

exports.doFieldValueOp = function doFieldValueOp(objValue, op, serverTime) {
  if (!_.isObject(op)) return;

  if (FieldValue.serverTimestamp().isEqual(op)) 
    return new Date(serverTime);

  if (op instanceof Timestamp) 
    return op.toDate();

  if (FieldValue.arrayRemove().isEqual(op)) {
    const replacement = Array.isArray(op.arg) ? op.arg : [op.arg];
    return objValue.filter(v => !replacement.includes(v));
  }

  if (FieldValue.arrayUnion().isEqual(op)) {
    const replacement = Array.isArray(op.arg) ? op.arg : [op.arg];
    return _.union(objValue, replacement);
  }
  
  if (FieldValue.increment().isEqual(op)) 
    return objValue == null ? op.arg : objValue + op.arg

}


exports.removeEmptyFirestoreProperties = function removeEmptyFirestoreProperties(obj, current, serverTime) {
  if (!_.isPlainObject(obj)) {
    return obj;
  }

  var keys = getKeys(obj);

  const doArrayRemove = function(replacement, sub) {
    return current[sub].filter(function(e) {
      return replacement.indexOf(e) === -1;
    });
  };

  if (keys.length > 0) {
    for (var s in obj) {
      var value = removeEmptyFirestoreProperties(obj[s], serverTime);
      if (FieldValue.delete().isEqual(value)) {
        delete obj[s];
      } else if (FieldValue.serverTimestamp().isEqual(value)) {
        obj[s] = new Date(serverTime);
      } else if (value instanceof Timestamp) {
        obj[s] = value.toDate();
      } else if (FieldValue.arrayRemove().isEqual(value)) {
        const replacement = Array.isArray(value.arg) ? value.arg : [value.arg];
        obj[s] = doArrayRemove(replacement, s);
      } else if (FieldValue.arrayUnion().isEqual(value)) {
        const replacement = Array.isArray(value.arg) ? value.arg : [value.arg];
        obj[s] = _.union(current[s], replacement);
      } else if (FieldValue.increment().isEqual(value)) {
        if (current == null || current[s] == null) {
          // no existing data
          obj[s] = value.arg;
        } else {
          // add to existing data
          obj[s] = current[s] + value.arg;
        }
      }
    }
  }
  return obj;

  function getKeys(o) {
    var result = [];
    for (var s in o) result.push(s);
    return result;
  }
};

exports.updateToRtdbObject = function updateToRtdbObject(update) {
  var result = {};
  for (var s in update) {
    var parts = s.split('/');
    var value = update[s];
    var o = result;
    do {
      var key = parts.shift();
      if(key) {
        var newObject = o[key] || {};
        o[key] = parts.length > 0 ? newObject : value;
        o = newObject;
      }
    } while (parts.length);
  }
  return result;
};

exports.updateToFirestoreObject = function updateToFirestoreObject(update) {
  var result = {};
  for (var s in update) {
    var parts = s.split('.');
    var value = update[s];
    var o = result;
    do {
      var key = parts.shift();
      if(key) {
        var newObject = o[key] || {};
        o[key] = parts.length > 0 ? newObject : value;
        o = newObject;
      }
    } while (parts.length);
  }
  return result;
};

/**
 * Recurse through obj and find all properties, which are undefined
 * @param obj
 * @returns {Array} Returns the property paths of undefined properties
 */
exports.findUndefinedProperties = function (obj) {
  var results = [];
  var path = [];

  var recurse = function (o, p) {
    var keys = _.keys(o);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (o[key] === undefined) {
        results.push(p.concat([key]).join('.'));
      } else {
        var to = typeof o[key];
        if (to === 'object') {
          recurse(o[key], p.concat([key]));
        }
      }
    }
  };

  recurse(obj, path);
  return results;
};

exports.createThenableReference = function(reference, promise) {
  reference.then = function(success, failure) {
    return promise.then(success).catch(failure);
  };
  return reference;
};

exports.cloneCustomizer = function(value) {
  if (value instanceof Date) {
    return Timestamp.fromMillis(value.getTime());
  }
};
