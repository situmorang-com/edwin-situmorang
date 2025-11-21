import express from "express";
import BetterSSE from "better-sse";
import jwt from "jsonwebtoken";

const { createSession } = BetterSSE;

const router = express.Router();

// Store all active SSE sessions
const sessions = new Set();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Custom auth middleware for SSE (accepts token from query param)
function authenticateSSE(req, res, next) {
  // EventSource can't send custom headers, so we use query params
  const token = req.query.token;

  console.log("🔐 SSE Auth check:", {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "none",
  });

  if (!token) {
    console.error("❌ No token provided in query params");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log("✅ SSE Token verified for user:", user.id, user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ SSE Token verification failed:", error.message);
    return res
      .status(403)
      .json({ error: "Invalid token", details: error.message });
  }
}

// SSE endpoint - establishes long-lived connection for push updates
router.get("/stream", authenticateSSE, async (req, res) => {
  try {
    console.log("📡 New SSE connection from:", req.user.email);

    // Create SSE session
    const session = await createSession(req, res);

    // Add to active sessions
    sessions.add(session);
    console.log("📊 Active SSE connections:", sessions.size);

    // Send initial connection confirmation
    session.push(
      {
        type: "connected",
        message: "SSE connection established",
        user: req.user.email,
      },
      "connection",
    );

    // Setup heartbeat to keep connection alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      try {
        session.push(
          { type: "heartbeat", timestamp: new Date().toISOString() },
          "heartbeat",
        );
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Cleanup on disconnect
    session.on("disconnected", () => {
      console.log("📡 SSE disconnected:", req.user.email);
      sessions.delete(session);
      clearInterval(heartbeatInterval);
      console.log("📊 Active SSE connections:", sessions.size);
    });
  } catch (error) {
    console.error("❌ SSE connection error:", error);
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
});

// Broadcast new entry to all connected clients
export function broadcastNewEntry(entry) {
  if (sessions.size === 0) {
    console.log("📡 No active SSE connections, skipping broadcast");
    return;
  }

  console.log("📡 Broadcasting new entry to", sessions.size, "clients");

  sessions.forEach((session) => {
    try {
      session.push(
        {
          type: "new_entry",
          entry: entry,
        },
        "entry",
      );
    } catch (error) {
      console.error("❌ Failed to broadcast to session:", error);
      sessions.delete(session);
    }
  });
}

// Broadcast entry update to all connected clients
export function broadcastUpdateEntry(entry) {
  if (sessions.size === 0) return;

  console.log("📡 Broadcasting entry update to", sessions.size, "clients");

  sessions.forEach((session) => {
    try {
      session.push(
        {
          type: "update_entry",
          entry: entry,
        },
        "entry",
      );
    } catch (error) {
      console.error("❌ Failed to broadcast update:", error);
      sessions.delete(session);
    }
  });
}

// Broadcast entry deletion to all connected clients
export function broadcastDeleteEntry(entryId) {
  if (sessions.size === 0) return;

  console.log("📡 Broadcasting entry deletion to", sessions.size, "clients");

  sessions.forEach((session) => {
    try {
      session.push(
        {
          type: "delete_entry",
          entryId: entryId,
        },
        "entry",
      );
    } catch (error) {
      console.error("❌ Failed to broadcast deletion:", error);
      sessions.delete(session);
    }
  });
}

// Get number of active connections (for monitoring)
export function getActiveConnectionsCount() {
  return sessions.size;
}

export default router;
