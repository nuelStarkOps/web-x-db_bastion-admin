// POST /login
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDB } = require("./db");
const { response } = require("./utils");

exports.handler = async (event) => {
  console.log("EVENT RECEIVED:", event);

  let body;

  // Safe JSON parse wrapper
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error("JSON parse failed:", err);
    return response(400, { message: "Invalid JSON format" });
  }

  const { username, password } = body;

  try {
    if (!username || !password) {
      return response(400, { message: "Missing fields" });
    }

    const db = getDB();

    // Fetch user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return response(401, { message: "Invalid credentials" });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return response(401, { message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return response(200, { token });

  } catch (err) {
    console.error("ERROR:", err);
    return response(500, { message: "Server error" });
  }
};