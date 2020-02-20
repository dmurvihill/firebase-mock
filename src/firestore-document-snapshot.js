'use strict';

var _ = require('./lodash');
var FieldPath = require('./firestore-field-path');
var utils = require('./utils');

function MockFirestoreDocumentSnapshot (id, ref, data) {
  this.id = id;
  this.ref = ref;
  this._snapshotdata = _.cloneDeep(data) || null;
  this.data = function() {
    return _.cloneDeepWith(this._snapshotdata, utils.cloneCustomizer);
  };
  this.exists = this._snapshotdata !== null;
  this.metadata = {
    fromCache: true,
    hasPendingWrites: false
  };
}

MockFirestoreDocumentSnapshot.prototype.get = function (field) {
  if (!field || !this.exists) return undefined;

  var parts;
  if (FieldPath.documentId().isEqual(field)) {
    return this.id;
  } else if (field instanceof FieldPath) {
    parts = _.clone(field._path);
  } else {
    parts = field.split('.');
  }
  var part = parts.shift();
  var data = this.data();

  while (part) {
    if (!data || !data.hasOwnProperty(part)) {
      return undefined;
    }

    data = data[part];
    part = parts.shift();
  }

  return data;
};

module.exports = MockFirestoreDocumentSnapshot;
