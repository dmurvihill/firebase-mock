# Tutorial: Messaging

MockFirebase replaces most of Firebase's messaging method of the admin API with simple mocks. Messaging methods will always succeed unless an error is specifically specified using [`failNext`](../API.md#failnextmethod-err---undefined).

## Send message

In this example, we'll send a new message using Firebase messaging.

```js
var mockMessaging = new MockMessaging();
var message = {
  notification: {
    title: 'message title',
    body: 'foobar'
  }
};
var result = mockMessaging.send(message);
mockMessaging.flush();
result.then(function (messageId) {
  console.assert(messageId !== '', 'message id is ' + messageId);
});
```

## Supported methods

- [send(message: Message, dryRun?: boolean): Promise<string>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send)
- [sendAll(messages: Array<Message>, dryRun?: boolean): Promise<BatchResponse>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-all)
- [sendMulticast(message: MulticastMessage, dryRun?: boolean): Promise<BatchResponse>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast)

## Set custom message response
In some cases it could be necessary to fake a custom send response (like a [BatchResponse](https://firebase.google.com/docs/reference/admin/node/admin.messaging.BatchResponse.html)). In this cases you can use `firebase.messaging().respondNext(methodName, result)` (similar to `firebase.messaging().failNext(methodName, err)`).

```js
var mockMessaging = new MockMessaging();
var messages = [
  {
    notification: {
      title: 'message title',
      body: 'foobar'
    }
  },
  {
    notification: {
      title: 'message title',
      body: 'second message'
    }
  }
];
var batchResponse = {
  failureCount: 1,
  responses: [
      {
          error: "something went wrong",
          success: false,
      },
      {
          messageId: "12345",
          success: true,
      },
  ],
  successCount: 1,
};
mockMessaging.respondNext('sendAll', batchResponse);
var result = mockMessaging.sendAll(messages);
mockMessaging.flush();
result.then(function (response) {
  console.assert(response === batchResponse, 'custom batch response is returned');
});
```

## Assert arguments
If you want to assert the arguments that were passed to any of the send-functions you can register a callback.
The callback receives as argument that contains all arguments that were passed to the send-function.

```js
var mockMessaging = new MockMessaging();
var message = {
  notification: {
    title: 'message title',
    body: 'foobar'
  }
};
mockMessaging.on('send', function(args) {
  console.assert(args[0] === message, 'message argument is coorect');
});
mockMessaging.send(message);
mockMessaging.flush();
```
