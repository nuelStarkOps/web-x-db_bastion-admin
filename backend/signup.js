// POST /signup
const bcrypt = require("bcryptjs");
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

  const { username, email, password } = body;

  try {
    if (!username || !email || !password) {
      return response(400, { message: "All fields are required" });
    }

    const db = getDB();

    // Check if user exists
    const [existing] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existing.length > 0) {
      return response(400, { message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashed]
    );

    return response(200, { message: "Signup successful" });

  } catch (err) {
    console.error("ERROR:", err);
    return response(500, { message: "Server error" });
  }
};