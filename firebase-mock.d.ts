/** Type definitions for firebase-mock module
 *
 * WARNING: this file is a hack to satisfy the type checker. Many
 * of the Firebase SDK methods declared here are _not_ implemented.
 * Check the actual source code before calling a new Firebase SDK
 * method.
 *
 * Any time you find something that's not implemented, please do us a
 * solid and leave a comment to that effect.
 */
declare module 'firebase-mock' {
  import * as firebase from 'firebase'
  import 'firebase/database'
  import {Observer} from "firebase";

  export type EventType = "value" | "child_added" | "child_changed" | "child_moved" | "child_removed";
  export type OnComplete = (a: Error | null) => any;

  export function MockFirebaseSdk(
    createDatabase?: (path: string) => MockFirebase,
    createAuth?: () => MockAuthentication,
    createFirestore?: () => MockFirestore,
    createStorage?: () => MockStorage,
    createMessaging?: () => MockMessaging,
  ): MockFirebaseSdk;

  export interface MockFirebaseSdk extends firebase.app.App {
    database: () => MockFirebaseDatabase;
    auth: () => MockAuthentication;
    firestore: () => MockFirestore;
    storage: () => MockStorage;
    messaging: () => MockMessaging;
    initializeApp: () => {
      database: {
        ref: (path: string) => MockFirebase,
        refFromURL: (path: string) => MockFirebase,
      };
      auth: MockAuthentication;
      firestore: MockFirestore;
      storage: MockStorage;
      messaging: MockMessaging;
    };
    delete: () => Promise<any>;
    name: string;
    options: Object;
    functions(region?: string): firebase.functions.Functions
  }

  export class MockFirebase implements firebase.database.Reference {

    /* Firebase database properties */
    readonly key: string | null;
    readonly parent: firebase.database.Reference | null;
    readonly ref: firebase.database.Reference;
    readonly root: firebase.database.Reference;

    child(path: string): MockFirebase;
    endAt(value: number | string | boolean | null, key?: string): firebase.database.Query;
    equalTo(value: number | string | boolean | null, key?: string): firebase.database.Query;
    isEqual(other: firebase.database.Query | null): boolean;
    limitToFirst(limit: number): firebase.database.Query;
    limitToLast(limit: number): firebase.database.Query;
    off(eventType?: EventType, callback?: (a: firebase.database.DataSnapshot, b?: string | null) => any, context?: Object | null): void;
    on(eventType: EventType, callback: (a: firebase.database.DataSnapshot | null, b?: string) => any, cancelCallbackOrContext?: Object | null, context?: Object | null): (a: firebase.database.DataSnapshot | null, b?: string) => any;
    onDisconnect(): firebase.database.OnDisconnect;
    once(eventType: EventType, successCallback?: (a: firebase.database.DataSnapshot, b?: string) => any, failureCallbackOrContext?: (e: Error) => any | Object | null, context?: Object | null): Promise<firebase.database.DataSnapshot>;
    orderByChild(path: string): firebase.database.Query;
    orderByKey(): firebase.database.Query;
    orderByPriority(): firebase.database.Query;
    orderByValue(): firebase.database.Query;
    push(value?: any, onComplete?: OnComplete): firebase.database.ThenableReference;
    remove(onComplete?: OnComplete): Promise<any>;
    set(value: any, onComplete?: OnComplete): Promise<any>;
    setPriority(priority: string | number | null, onComplete: OnComplete): Promise<any>;
    setWithPriority(newVal: any, newPriority: string | number | null, onComplete?: OnComplete): Promise<any>;
    startAt(value: number | string | boolean | null, key?: string): firebase.database.Query;
    toJSON(): Object;
    toString(): string;
    transaction(transactionUpdate: (a: any) => any, onComplete?: (a: Error | null, b: boolean, c: firebase.database.DataSnapshot | null) => any, applyLocally?: boolean): Promise<any>;
    update(values: Object, onComplete?: OnComplete): Promise<any>;


    /* Mock properties */
    flush(delay?: number): MockFirebase;
    autoFlush(delayOrSetting?: number | boolean): MockFirebase;
    failNext(method: string, err: Error): void;
    // TODO forceCancel(err: any, event?: string, callback: ???, context: ): void;
    getData(): any;
    getKeys(): string[];
    // TODO fakeEvent(event: string, key?: string, data?: any, previousChild?: ???, priority: ???): MockFirebase;
    getFlushQueue(): any[] // TODO Event[];
  }

  export interface MockFirebaseDatabase extends firebase.database.Database {
    ref: (path: string) => MockFirebase;
    refFromURL: (path: string) => MockFirebase;

    // WARNING: items below are not implemented.
    app: firebase.app.App;
    goOffline(): any;
    goOnline(): any;
  }

  export class MockAuthentication implements firebase.auth.Auth {

    /* Firebase API properties */
    app: firebase.app.App;
    applyActionCode(code: string): Promise<void>;
    checkActionCode(code: string): Promise<firebase.auth.ActionCodeInfo>;
    confirmPasswordReset(code: string, newPassword: string): Promise<void>;
    createUserAndRetrieveDataWithEmailAndPassword(
      email: string,
      password: string
    ): Promise<firebase.auth.UserCredential>;
    createUserWithEmailAndPassword(
      email: string,
      password: string
    ): Promise<firebase.auth.UserCredential>;
    currentUser: firebase.User | null;
    fetchProvidersForEmail(email: string): Promise<Array<string>>;
    fetchSignInMethodsForEmail(email: string): Promise<Array<string>>;
    isSignInWithEmailLink(emailLink: string): boolean;
    getRedirectResult(): Promise<firebase.auth.UserCredential>;
    languageCode: string | null;
    settings: firebase.auth.AuthSettings;
    onAuthStateChanged(
      nextOrObserver:
        | firebase.Observer<any>
        | ((a: firebase.User | null) => any),
      error?: (a: firebase.auth.Error) => any,
      completed?: firebase.Unsubscribe
    ): firebase.Unsubscribe;
    onIdTokenChanged(
      nextOrObserver:
        | firebase.Observer<any>
        | ((a: firebase.User | null) => any),
      error?: (a: firebase.auth.Error) => any,
      completed?: firebase.Unsubscribe
    ): firebase.Unsubscribe;
    sendSignInLinkToEmail(
      email: string,
      actionCodeSettings: firebase.auth.ActionCodeSettings
    ): Promise<void>;
    sendPasswordResetEmail(
      email: string,
      actionCodeSettings?: firebase.auth.ActionCodeSettings | null
    ): Promise<void>;
    setPersistence(persistence: firebase.auth.Auth.Persistence): Promise<void>;
    signInAndRetrieveDataWithCredential(
      credential: firebase.auth.AuthCredential
    ): Promise<firebase.auth.UserCredential>;
    signInAnonymously(): Promise<firebase.auth.UserCredential>;
    signInAnonymouslyAndRetrieveData(): Promise<firebase.auth.UserCredential>;
    signInWithCredential(
      credential: firebase.auth.AuthCredential
    ): Promise<firebase.User>;
    signInWithCustomToken(token: string): Promise<firebase.auth.UserCredential>;
    signInAndRetrieveDataWithCustomToken(
      token: string
    ): Promise<firebase.auth.UserCredential>;
    signInWithEmailAndPassword(
      email: string,
      password: string
    ): Promise<firebase.auth.UserCredential>;
    signInAndRetrieveDataWithEmailAndPassword(
      email: string,
      password: string
    ): Promise<firebase.auth.UserCredential>;
    signInWithPhoneNumber(
      phoneNumber: string,
      applicationVerifier: firebase.auth.ApplicationVerifier
    ): Promise<firebase.auth.ConfirmationResult>;
    signInWithEmailLink(
      email: string,
      emailLink?: string
    ): Promise<firebase.auth.UserCredential>;
    signInWithPopup(
      provider: firebase.auth.AuthProvider
    ): Promise<firebase.auth.UserCredential>;
    signInWithRedirect(provider: firebase.auth.AuthProvider): Promise<void>;
    signOut(): Promise<void>;
    updateCurrentUser(user: firebase.User | null): Promise<void>;
    useDeviceLanguage(): void;
    verifyPasswordResetCode(code: string): Promise<string>;

    /* Mock properties */
    changeAuthState(authData: firebase.UserInfo | null): void;
    getUserByEmail(email: string): Promise<object>;
    getUser(uid: string): Promise<object>;
    flush(delay?: number): MockAuthentication;
    autoFlush(delay?: number): MockAuthentication;
    failNext(methodName: string, err: Error): void;
  }

  export class MockFirestore implements firebase.firestore.Firestore {
    app: firebase.app.App;
    batch(): firebase.firestore.WriteBatch;
    collection(collectionPath: string): firebase.firestore.CollectionReference;
    disableNetwork(): Promise<void>;
    doc(documentPath: string): firebase.firestore.DocumentReference;
    enableNetwork(): Promise<void>;
    enablePersistence(settings?: firebase.firestore.PersistenceSettings): Promise<void>;
    runTransaction<T>(updateFunction: (transaction: firebase.firestore.Transaction) => Promise<T>): Promise<T>;
    settings(settings: firebase.firestore.Settings): void;

    // This is undocumented but our code won't compile without it
    INTERNAL: { delete: () => Promise<void> };
  }

  export class MockStorage implements firebase.storage.Storage {
    app: firebase.app.App;
    maxOperationRetryTime: number;
    maxUploadRetryTime: number;
    ref(path?: string): firebase.storage.Reference;
    refFromURL(url: string): firebase.storage.Reference;
    setMaxOperationRetryTime(time: number): any;
    setMaxUploadRetryTime(time: number): any;
  }

  export class MockMessaging implements firebase.messaging.Messaging {
    deleteToken(token: string): Promise<boolean>;
    getToken(): Promise<string | null>;
    onMessage(nextOrObserver: firebase.NextFn<any> | Observer<any>, error?: firebase.ErrorFn, completed?: firebase.CompleteFn): firebase.Unsubscribe;
    onTokenRefresh(nextOrObserver: firebase.NextFn<any> | Observer<any>, error?: firebase.ErrorFn, completed?: firebase.CompleteFn): firebase.Unsubscribe;
    requestPermission(): Promise<void>;
    setBackgroundMessageHandler(callback: (payload: any) => Promise<any> | void): void;
    usePublicVapidKey(b64PublicKey: string): void;
    useServiceWorker(registration: ServiceWorkerRegistration): void;
  }

  export class DeltaDocumentSnapshot {}
}
