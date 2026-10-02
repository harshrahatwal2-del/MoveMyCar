/* ===========================================================
   MoveMyCar — notifications.js
   Sends a real SMS using Twilio. This is kept in its own file
   (rather than stuffed into server.js) so the "how do we actually
   message someone" logic is easy to find and test on its own.
   =========================================================== */

require('dotenv').config(); // loads values from a local .env file into process.env

const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

// Only create a real Twilio client if all three secrets are actually set.
// This lets the rest of the app run fine even before you've set up Twilio —
// it'll just skip sending and tell you why, instead of crashing.
const client = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

/**
 * Sends an SMS. Never throws — always returns an object describing what
 * happened, so the caller (server.js) can decide what to do without
 * needing a try/catch of its own every time.
 *
 * @param {string} toPhone - E.164 format, e.g. "+919876543210"
 * @param {string} message - the SMS body
 * @returns {Promise<{sent: boolean, reason?: string, sid?: string}>}
 */
async function sendSMS(toPhone, message) {
  if (!client) {
    return { sent: false, reason: 'Twilio is not configured yet (missing .env values).' };
  }
  if (!toPhone) {
    return { sent: false, reason: 'This vehicle has no phone number on file.' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: toPhone
    });
    return { sent: true, sid: result.sid };
  } catch (err) {
    // Common trial-account reason: the "to" number hasn't been verified yet.
    console.error('SMS send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendSMS };
