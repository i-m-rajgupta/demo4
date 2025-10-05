require("dotenv").config();
const express = require("express");
const path = require('path');
const fetch = require("node-fetch");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const connectDB = require("./mongoose.js");
const Counsellor = require("./models/counsellorSchema.js");
const User = require("./models/userSchema.js");

const app = express();

// Connect to MongoDB
connectDB(process.env.MONGO_URL);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend files from "frontend" directory
app.use(express.static(path.join(__dirname, 'frontend')));

// -------------------- AUTH HELPERS --------------------
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized: no token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // should contain id, email, role (as set in login)
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Unauthorized: invalid token" });
  }
};

// -------------------- PUBLIC HTML --------------------
app.get("/api", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get("/api/counsellor/new", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'counsellorSignup.html')));
app.get("/api/user/new", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'user_register.html')));
app.get("/api/login", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'login.html')));
app.get("/api/about", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'about.html')));
app.get("/api/termsandpolicy", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'termsandpolicy.html')));

// -------------------- AUTH ENDPOINTS --------------------
// Register (user or counsellor)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { role, name, email, password, dob, phone, place, qualification, experience } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ success: false, error: "Email, password and role required" });

    const model = role === "counsellor" ? Counsellor : User;
    const exists = await model.findOne({ email });
    if (exists) return res.status(400).json({ success: false, error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRecord = new model({
      name,
      email,
      password: hashedPassword,
      dob,
      phone,
      place,
      ...(role === "counsellor" && { qualification, experience })
    });

    await newRecord.save();

    // Return success JSON (frontend can redirect)
    res.status(201).json({ success: true, message: "Registered successfully. Please login." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login (user or counsellor)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email and password required" });

    let user = await User.findOne({ email });
    let role = "user";

    if (!user) {
      user = await Counsellor.findOne({ email });
      role = "counsellor";
    }

    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const token = generateToken({ id: user._id, email: user.email, role, name: user.name });

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role },
      token
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- AUTH "whoami" endpoint --------------------
// Single endpoint for frontend to fetch current authenticated user's info (works for both roles)
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    // req.user was set by authenticate middleware and should include id and role
    const { id, role } = req.user || {};
    if (!id) return res.status(400).json({ success: false, error: 'Invalid token' });

    if (role === 'counsellor') {
      const counsellor = await Counsellor.findById(id).select('-password');
      if (!counsellor) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, counsellor, role: 'counsellor' });
    } else {
      const user = await User.findById(id).select('-password');
      if (!user) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, user, role: 'user' });
    }
  } catch (err) {
    console.error('/api/auth/me error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// -------------------- DASHBOARD HTML --------------------
app.get("/api/user/dashboard", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'userDashboard.html')));
app.get("/api/counsellor/dashboard", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'counsellorDashboard.html')));

// -------------------- PROTECTED API --------------------
app.get("/api/user/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/counsellor/me", authenticate, async (req, res) => {
  try {
    const counsellor = await Counsellor.findById(req.user.id).select('-password');
    if (!counsellor) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, counsellor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// -------------------- CHATBOT --------------------
app.post("/api/chatbot", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ reply: "No message provided." });

  try {
    let botReply;
    if (/sad|depressed|lonely/i.test(userMessage)) {
      botReply = "I'm really sorry you're feeling sad. I'm here to listen. Can you tell me more?";
    } else if (/anxious|stressed|nervous/i.test(userMessage)) {
      botReply = "I understand that you're feeling anxious. Take a deep breath. Would you like some tips to manage stress?";
    } else {
      // If you use an external service, ensure WOLFRAM_CLOUD_URL is set
      if (process.env.WOLFRAM_CLOUD_URL) {
        const wolframResponse = await fetch(process.env.WOLFRAM_CLOUD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage })
        });
        botReply = await wolframResponse.text();
      } else {
        botReply = "Thanks for your message. I'm here to help — tell me more.";
      }
    }

    res.json({ reply: botReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

// -------------------- OTHER PAGES --------------------
app.get("/api/user/health-tracker", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'healthTracker.html')));
app.get("/api/self-analysis", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'selfAnalysis.html')));
app.get("/api/user/test", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'test.html')));
app.get("/api/user/report", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'report.html')));
app.get("/api/role", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'role.html')));
app.get("/api/chatbot", (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'chatbot.html')));

// -------------------- SERVER --------------------
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = index;
