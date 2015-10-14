// Configuration constants
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
} from '../keys';

import { isDefined } from './utils';
import ensureAuthenticated from './middleware/ensureAuthenticated';
import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import { OAuth2Strategy } from 'passport-google-oauth';
import connectRedis from 'connect-redis';
import socketIo from 'socket.io';
import passportSocketIo from 'passport.socketio';
import http from 'http';
import invariant from 'invariant';

invariant(
  isDefined(process.env.GOOGLE_CLIENT_ID) || isDefined(GOOGLE_CLIENT_ID),
  'GOOGLE_CLIENT_ID is not set, add it in keys.js or as an environment variable.'
);

invariant(
  isDefined(process.env.GOOGLE_CLIENT_SECRET) || isDefined(GOOGLE_CLIENT_SECRET),
  'GOOGLE_CLIENT_SECRET is not set, add it in keys.js or as an environment variable.'
);

invariant(
  isDefined(process.env.GOOGLE_CALLBACK_URL) || isDefined(GOOGLE_CALLBACK_URL),
  'GOOGLE_CALLBACK_URL is not set, add it in keys.js or as an environment variable.'
);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new OAuth2Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

const app = express();

const RedisStore = connectRedis(session);
const sessionStore = new RedisStore();
// const sessionStore = new MemoryStore();

const sessionOpts = {
  key: 'connect.sid',
  store: sessionStore,
  secret: 'asdasdsdas1312312',
  resave: true,
  saveUninitialized: true
};

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(cookieParser(sessionOpts.secret));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sessionOpts));
app.use(passport.initialize());
app.use(passport.session());

app.route('/')
  .get(function(req, res) {
    res.render('index', { user: req.user });
  });

app.route('/account')
  .get(ensureAuthenticated, function(req, res) {
    console.log('app.route sees :: ', req.session);
    req.session.save();
    res.render('account', { user: req.user });
  });

app.route('/login')
  .get(function(req, res) {
    res.render('login', { user: req.user });
  });

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.route('/auth/google')
  .get(passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login'
    ]
  }),
  function(req, res) {});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.route('/auth/google/callback')
  .get(passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    req.session.save();
    console.log(sessionStore);
    res.redirect('/');
  });

app.route('/logout')
  .get(function(req, res) {
    req.logout();
    res.redirect('/');
  });

const server = http.createServer(app);

const passportAuthorizeConfig = {
  cookieParser: cookieParser,
  key: sessionOpts.key,
  secret: sessionOpts.secret,
  store: sessionStore,
  success: (data, accept) => {
    console.log('successful connection to socket.io');
    accept();
  },
  fail: (data, message, error, accept) => {
    console.log('failed connection to socket.io:', message);
    console.log(data.sessionID);

    if(error) {
      accept(new Error(message));
    }
  }
};

const io = socketIo.listen(server)
  .use(passportSocketIo.authorize(passportAuthorizeConfig))
  .on('connection', function(socket) {
    socket.emit('connected', { username: socket.request.user.displayName });

    console.log('Socket.io User Info ::', socket.request.user);
  });

server.listen(process.env.PORT || 5001);
