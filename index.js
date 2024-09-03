const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = '900634394608-5juisvhtut7ps5q7cmb9gnqjgd6lh9i3.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://calendar-event-7axn.onrender.com/oauth2callback'; // Update to your redirect URI
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

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

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
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to the session
    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);
    
    // Log the refresh token if available
    if (tokens.refresh_token) {
      console.log('Refresh Token:', tokens.refresh_token);
    }
    
    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Authentication failed.');
  }
});

// POST route for creating a Google Calendar event
app.post('/create-event', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).send('Authentication required.');
  }

  const { name, email, date, time, message } = req.body;

  // Google Calendar authentication
  oauth2Client.setCredentials(req.session.tokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Create event start and end times
  const eventStartTime = new Date(`${date}T${time}`);
  const eventEndTime = new Date(eventStartTime);
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 30);

  // Define the event
  const event = {
    summary: `Appointment with ${name}`,
    description: message,
    start: {
      dateTime: eventStartTime,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: eventEndTime,
      timeZone: 'America/Los_Angeles',
    },
    attendees: [{ email }],
  };

  try {
    // Insert the event into the calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.status(200).send('Event created successfully');
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Error creating event');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Node.js server is running on port ${port}`);
});
