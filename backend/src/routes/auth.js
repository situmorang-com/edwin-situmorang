import express from "express";
import { OAuth2Client } from "google-auth-library";
import { dbRun, dbGet } from "../db/database.js";
import { generateToken } from "../middleware/auth.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth login
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await dbGet("SELECT * FROM users WHERE google_id = ?", [
      googleId,
    ]);

    if (!user) {
      // Create new user
      const result = await dbRun(
        `INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)`,
        [googleId, email, name, picture],
      );

      user = await dbGet("SELECT * FROM users WHERE id = ?", [result.lastID]);
    } else {
      // Update user info
      await dbRun(
        `UPDATE users SET email = ?, name = ?, picture = ? WHERE google_id = ?`,
        [email, name, picture, googleId],
      );

      user = await dbGet("SELECT * FROM users WHERE google_id = ?", [googleId]);
    }

    // Generate JWT
    const jwtToken = generateToken(user);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

export default router;
