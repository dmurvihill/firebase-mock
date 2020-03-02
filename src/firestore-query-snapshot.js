'use strict';

var _ = require('./lodash');
var DocumentSnapshot = require('./firestore-document-snapshot');

function MockFirestoreQuerySnapshot (ref, data, priorData) {
  var self = this;

  this._ref = ref;
  this.data = _.cloneDeep(data) || {};
  if (_.isObject(this.data) && _.isEmpty(this.data)) {
    this.data = {};
  }
  this.size = _.size(this.data);
  this.empty = this.size === 0;

  this.docs = _.map(this.data, function (value, key) {
    return new DocumentSnapshot(key, self._ref.doc(key), value);
  });

  var prior = priorData || {};
  this._changes = _.reduce(
    this.docs,
    function(changes, doc) {      
      if (!prior[doc.id]) changes.push({ type: "added", doc });
      if (prior[doc.id] && !_.isEqual(doc.data(), prior[doc.id]))
        changes.push({ type: "modified", doc });

      return changes;
    },
    []
  );

  _.forEach(prior, function (value, key) {
    if (!data[key]) self._changes.push({ 
      type: 'removed', 
      doc: new DocumentSnapshot(key, self._ref.doc(key), value) 
    });
  })
}

MockFirestoreQuerySnapshot.prototype.forEach = function(callback, context) {
  _.forEach(this.docs, function(doc) {
    callback.call(context, doc);
  });
};

MockFirestoreQuerySnapshot.prototype.docChanges = function() {
  var self = this;
  return {
    forEach: function(callback, context) {
      _.forEach(self._changes, function(change) {
        callback.call(context, change);
      });
    }
  };
};

module.exports = MockFirestoreQuerySnapshot;
