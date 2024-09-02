// Import required modules
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Google Calendar API setup
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Set credentials using the refresh token
oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Endpoint to handle booking data from WordPress plugin
app.post('/create-event', async (req, res) => {
    const { name, email, date, time, message } = req.body;

    const eventStartTime = new Date(`${date}T${time}`);
    const eventEndTime = new Date(eventStartTime);
    eventEndTime.setMinutes(eventEndTime.getMinutes() + 30); // Assuming 30 minutes duration

    const event = {
        summary: `Appointment with ${name}`,
        description: message,
        start: {
            dateTime: eventStartTime.toISOString(),
            timeZone: 'America/Los_Angeles', // Set your timezone
        },
        end: {
            dateTime: eventEndTime.toISOString(),
            timeZone: 'America/Los_Angeles', // Set your timezone
        },
        attendees: [{ email: email }],
    };

    try {
        await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        res.status(200).send({ success: true, message: 'Event created successfully!' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).send({ success: false, message: 'Failed to create event', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
