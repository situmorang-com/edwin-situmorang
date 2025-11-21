import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log("🔐 Auth check:", {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "none",
  });

  if (!token) {
    console.error("❌ No token provided");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token verified for user:", user.id, user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res
      .status(403)
      .json({ error: "Invalid token", details: error.message });
  }
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "30d" },
  );
}
