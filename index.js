const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = '900634394608-5juisvhtut7ps5q7cmb9gnqjgd6lh9i3.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://calendar-event-7axn.onrender.com/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Middleware for session management
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initial route to start OAuth flow
app.get('/', (req, res) => {
  if (!req.session.tokens) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    res.redirect(authUrl);
  } else {
    oauth2Client.setCredentials(req.session.tokens);
    res.send('Node.js server is running and authenticated!');
  }
});

// OAuth2 callback
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  
  // Save tokens to the session
  req.session.tokens = tokens;
  oauth2Client.setCredentials(tokens);
  
  // If you get a refresh token, save it securely
  console.log('Refresh Token:', tokens.refresh_token);
  
  res.send('Authentication successful! You can close this window.');
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Node.js server is running on port ${port}`);
});
