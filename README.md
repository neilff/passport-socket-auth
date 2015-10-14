# passport-socket-auth

> Demonstration of using [passport-google-oauth](https://github.com/jaredhanson/passport-google-oauth) along with [passport.socketio](https://github.com/jfromaniello/passport.socketio) to create a Google Oauth2 enabled Socket.io server

[Example on Heroku](http://passport-socket-auth.herokuapp.com/)

## Installation

#### Step 0

```
git clone https://github.com/neilff/passport-socket-auth.git
npm install
```

#### Step 1

You will need to provide the server the following constants:

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

You can provide them as a `keys.js` file in the root folder, or as environment variables. These are specific to Google Ouath2 and Passport.js, so please refer to their documentation if there is confusion here.

#### Step 2

You will also need to make sure that the client side Socket.io connection is correctly pointing to the Socket.io server. Currently it is pointing to `127.0.0.1:5001` in the `layout.ejs` file. This should *never* be pointed to `localhost` as this will lead to Socket.io being unable to find the session. See this [StackOverflow post](http://stackoverflow.com/questions/25456656/passport-socketio-has-issues-finding-session) for a description of this issue.

#### Step 3

```
npm run start
```

## Notes

While trying to build this out myself, I ran into issues when using [passport.socketio](https://github.com/jfromaniello/passport.socketio) and the latest versions of Socket.io, and [express-session](https://github.com/expressjs/session). I ended up downgrading to the version which [passport.socketio](https://github.com/jfromaniello/passport.socketio/blob/master/package.json) uses for testing and everything began working after that.

This issue is documented here [#110](https://github.com/jfromaniello/passport.socketio/issues/110).
