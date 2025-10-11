require("dotenv").config();
const express = require("express");
const path = require('path');
const fetch = require("node-fetch");
const fetchfunc = fetch.default;
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
      // If you use an external service, ensure WOLFRAM_CLOUD_URL is set
      console.log(process.env.WOLFRAM_CLOUD_URL);
      if (process.env.WOLFRAM_CLOUD_URL) {
        const wolframResponse = await fetchfunc(`${process.env.WOLFRAM_CLOUD_URL}?message=${userMessage}`);
        console.log(wolframResponse);
        botReply = await wolframResponse.text();
         console.log(botReply);
      } else {
        botReply = "Thanks for your message. I'm here to help — tell me more.";
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

// -------------------- SEARCH (public) --------------------
// GET /api/search?q=term&limit=10&type=counsellor
app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]); // keep front-end behavior simple

    const rawLimit = parseInt(req.query.limit || '10', 10);
    const limit = Number.isNaN(rawLimit) ? 10 : Math.max(1, Math.min(50, rawLimit));

    // Optional type filter (if you want to filter different collections later)
    const typeFilter = req.query.type ? String(req.query.type).trim().toLowerCase() : null;

    // Fields to project (do NOT expose password)
    const project = {
      password: 0,
      __v: 0
    };

    // Try to detect whether a text index exists; if yes use $text for relevance scoring
    let indexes = [];
    try {
      indexes = await Counsellor.collection.indexes();
    } catch (idxErr) {
      // ignore - some drivers/environments may restrict listIndexes, we'll fallback to regex
      console.warn('[search] index list error (ignoring):', idxErr.message);
    }

    const hasTextIndex = indexes.some(ix => {
      // index.key can be object like { name: 'text', title: 'text', ... }
      const keys = Object.keys(ix.key || {});
      return keys.some(k => ix.key[k] === 'text' || ix.name?.toLowerCase().includes('text'));
    });

    let results = [];

    if (hasTextIndex) {
      // Use text search for better relevance if user created a text index on counsellors
      // Example index creation (run once): db.counsellors.createIndex({ name: "text", title: "text", qualification: "text", subtitle: "text", place: "text" })
      const textQuery = { $text: { $search: q } };
      if (typeFilter) {
        // if you plan to add a 'type' field to counsellors, you can filter here
        textQuery.type = typeFilter;
      }

      results = await Counsellor.find(textQuery, { score: { $meta: "textScore" }, ...project })
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } else {
      // Fallback: case-insensitive regex search across several fields
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape user input
      const orClauses = [
        { name: regex },
        { title: regex },
        { qualification: regex },
        { subtitle: regex },
        { place: regex }
      ];

      // If you later add tags or specialties, include them here
      const match = { $or: orClauses };
      if (typeFilter) {
        match.type = typeFilter;
      }

      results = await Counsellor.find(match, project)
        .limit(limit)
        .lean();
      
      // Basic heuristic: move exact prefix matches toward top
      results.sort((a, b) => {
        const score = (item) => {
          const hay = (item.name || '') + ' ' + (item.title || '') + ' ' + (item.qualification || '');
          const low = String(hay).toLowerCase();
          if (low.startsWith(q.toLowerCase())) return 10;
          if (low.includes(' ' + q.toLowerCase() + ' ')) return 6;
          if (low.includes(q.toLowerCase())) return 3;
          return 0;
        };
        return score(b) - score(a);
      });
    }

    // Shape response: keep only fields the front-end needs
    const shaped = results.map(r => ({
      id: r._id,
      name: r.name,
      title: r.title,
      qualification: r.qualification || r.qual || null,
      subtitle: r.subtitle || null,
      place: r.place || null,
      phone: r.phone || null,
      email: r.email ? (process.env.NODE_ENV === 'production' ? undefined : r.email) : undefined, // optionally hide email in production
      // include any other non-sensitive fields you want
    }));

    return res.json(shaped);
  } catch (err) {
    console.error('/api/search error:', err);
    return res.status(500).json({ success: false, error: 'Search failed' });
  }
});


// -------------------- SERVER --------------------
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
