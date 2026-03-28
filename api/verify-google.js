import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];

    // Console logging the user's name and email as requested
    console.log('--- User Verified Successfully ---');
    console.log(`Name: ${payload.name}`);
    console.log(`Email: ${payload.email}`);
    console.log('---------------------------------');

    // In a production app, you would generate a JWT token or set a session
    // cookie here for the frontend to manage authentication status.
    
    // Returning verification status and user info
    res.status(200).json({ 
      message: 'Success', 
      user: {
        id: userid,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified: payload.email_verified
      } 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      error: 'Invalid token during verification',
      details: error.message 
    });
  }
}
