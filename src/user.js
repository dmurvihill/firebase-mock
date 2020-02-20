'use strict';

var _ = require('./lodash');
var Promise = require('rsvp').Promise;

function MockFirebaseUser(ref, data) {
  this._auth = ref;
  this._idtoken = Math.random().toString();
  this._tokenValidity = _tokenValidity(
    data._tokenValidity ? data._tokenValidity : {}
  );
  this.customClaims = data.customClaims || {};
  this.uid = data.uid;
  this.email = data.email;
  this.password = data.password;
  this.phoneNumber = data.phoneNumber;
  this.displayName = data.displayName;
  this.photoURL = data.photoURL;
  this.emailVerified = !!data.emailVerified;
  this.isAnonymous = !!data.isAnonymous;
  this.metadata = data.metadata;
  this.providerData = data.providerData || [];
  this.providerId = data.providerId;
  this.refreshToken = data.refreshToken;
}

MockFirebaseUser.msg_tokenExpiresBeforeIssuance =
    'Auth token expires before it is issued';
MockFirebaseUser.msg_tokenIssuedBeforeAuth =
    'Auth token was issued before the user authenticated';
MockFirebaseUser.msg_tokenAuthedInTheFuture =
    'Auth token shows user authenticating in the future';
MockFirebaseUser.msg_tokenIssuedInTheFuture =
    'Auth token was issued in the future';

MockFirebaseUser.prototype.clone = function () {
  var user = new MockFirebaseUser(this._auth, this);
  user._idtoken = this._idtoken;
  user.customClaims = _.cloneDeep(this.customClaims);
  return user;
};

MockFirebaseUser.prototype.delete = function () {
  return this._auth.deleteUser(this.uid);
};

MockFirebaseUser.prototype.reload = function () {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.getUser(self.uid).then(function(user) {
      self.email = user.email;
      self.displayName = user.displayName;
      self.phoneNumber = user.phoneNumber;
      self.emailVerified = !!user.emailVerified;
      self.isAnonymous = !!user.isAnonymous;
      self.metadata = user.metadata;
      self.photoURL = user.photoURL;
      self.providerData = user.providerData;
      self.providerId = user.providerId;
      self.refreshToken = user.refreshToken;
      self.customClaims = user.customClaims;
      self._idtoken = user._idtoken;
      resolve();
    }).catch(reject);
  });
};

MockFirebaseUser.prototype.updateEmail = function (newEmail) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.changeEmail({
      newEmail: newEmail,
      oldEmail: self.email,
      password: self.password
    }).then(function() {
      self.email = newEmail;
      resolve();
    }).catch(reject);
  });
};

MockFirebaseUser.prototype.updatePassword = function (newPassword) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.changePassword({
      email: self.email,
      oldPassword: self.password,
      newPassword: newPassword
    }).then(function() {
      self.password = newPassword;
      resolve();
    }).catch(reject);
  });
};

// Passing a null value will delete the current attribute's value, but not
// passing a property won't change the current attribute's value:
// Let's say we're using the same user than before, after the update.
MockFirebaseUser.prototype.updateProfile = function (profile) {
  if (!profile) return Promise.reject();
  var self = this;
  var user = _.find(this._auth._auth.users, function(u) {
    return u.uid === self.uid;
  });
  if (typeof profile.displayName !== 'undefined') {
    this.displayName = profile.displayName;
    user.displayName = profile.displayName;
  }
  if (typeof profile.photoURL !== 'undefined') {
    this.photoURL = profile.photoURL;
    user.photoURL = profile.photoURL;
  }
  return Promise.resolve();
};

MockFirebaseUser.prototype.getIdToken = function (forceRefresh) {
  return (forceRefresh ? this._refreshIdToken() : Promise.resolve())
    .then(() => this._idtoken);
};

MockFirebaseUser.prototype.toJSON = function() {
  const json = {
    uid: this.uid,
    email: this.email,
    emailVerified: this.emailVerified,
    displayName: this.displayName,
    photoURL: this.photoURL,
    phoneNumber: this.phoneNumber,
  };
  if (this.metadata) {
    json.createdAt = this.metadata.createdAt;
    json.lastLoginAt = this.metadata.lastLoginAt;
  }
  json.providerData = [];
  for (const entry of this.providerData) {
    json.providerData.push(entry.toJSON());
  }
  return json;
};

MockFirebaseUser.prototype.getIdTokenResult = function (forceRefresh) {
  if (forceRefresh) {
    this._refreshIdToken();
  }

  return Promise.resolve({
    authTime: this._tokenValidity.authTime.toISOString(),
    issuedAtTime: this._tokenValidity.issuedAtTime.toISOString(),
    expirationTime: this._tokenValidity.expirationTime.toISOString(),
    signInProvider: this.providerId || null,
    claims: this.customClaims,
    token: this._idtoken,
  });
};

MockFirebaseUser.prototype._refreshIdToken = function () {
  this._tokenValidity.issuedAtTime = new Date();
  this._tokenValidity.expirationTime = defaultExpirationTime(new Date());
  this._idtoken = Math.random().toString();
  return this._auth.updateUser(this)
    .then(() => this.getIdTokenResult())
    .catch(() => this.getIdTokenResult());
};

/** Create a user's internal token validity store
 *
 * @param data the `data.idTokenResult` object from the User constructor
 * @return object that is to become the User's _tokenValidity member
 */
function _tokenValidity(data) {
  const now = new Date();
  const authTime = data.authTime ?
    data.authTime : new Date();
  const issuedTime = data.issuedAtTime || new Date(authTime.getTime());
  const expirationTime = data.expirationTime ?
      data.expirationTime : defaultExpirationTime(issuedTime);
  if (expirationTime < issuedTime) {
    throw new Error(MockFirebaseUser.msg_tokenExpiresBeforeIssuance);
  } else if (issuedTime < authTime) {
    throw new Error(MockFirebaseUser.msg_tokenIssuedBeforeAuth);
  } else if (now < authTime) {
    throw new Error(MockFirebaseUser.msg_tokenAuthedInTheFuture);
  } else if (now < issuedTime) {
    throw new Error(MockFirebaseUser.msg_tokenIssuedInTheFuture);
  } else return {
    authTime: authTime,
    issuedAtTime: issuedTime,
    expirationTime: expirationTime,
  };
}

function defaultExpirationTime(issuedTime) {
  return new Date(issuedTime.getTime() + 3600000);
}

module.exports = MockFirebaseUser;
