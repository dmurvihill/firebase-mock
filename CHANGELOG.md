# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Changelog
- Mock `auth.Auth.onIdTokenChanged()` method, matching the previous
  behavior of `onAuthStateChanged()` (see below)
- Support for Firebase Messaging (Admin API)

### Changed
- (Breaking) Consistent with Firebase SDK [version 4.0.0](https://firebase.google.com/support/release-notes/js#version_500_-_may_8_2018) and later,
  and later, `onAuthStateChanged` no longer issues an event when a new
  ID token is issued for the same user. The `onIdTokenChanged` method is
  now mocked, keeping the previous behavior.
- `MockStorageFile.download()` now allows omitting the destination arg;
  in that case, it simply resolves the `Promise` with the file contents
  and does not write it anywhere else.

### Fixed
- `onAuthStateChanged` now correctly calls its callback immediately with
  the current auth state.  
- `MockStorage.bucket()` and `MockStorageBucket.file()` now return the
  existing artifact if one exists, rather than overwriting it with a new
  one.
- `DataSnapshot.child` now correctly splits child paths by '/'
  characters
- Boolean values are now allowed in RTDB priority fields and as
  arguments to `Query.startAt`, `Query.endAt`, and `Query.equalTo`.
- `MockFirestoreDocument.create()` now correctly returns a
  `Promise<WriteResult>` instead of `Promise<void>`.


[Unreleased]: https://github.com/dmurvihill/firebase-mock/compare/v2.2.10...HEAD
