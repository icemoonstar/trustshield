// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

// ======= Middleware =======
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log("🔍 IP Check:", req.headers['x-forwarded-for'], req.connection.remoteAddress);
  next();
});
// ======= MongoDB Setup =======
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ======= IP Helper =======
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
};

app.post('/api/logAccess', async (req, res) => {
  const { email, result } = req.body;
  const ip = getClientIp(req);

  const logEntry = {
    email,
    result,
    ipUsed: ip,
    timestamp: new Date()
  };

  try {
    await LogModel.create(logEntry); // MongoDB
    res.status(200).json({ message: 'Log saved', ipUsed: ip });
  } catch (err) {
    res.status(500).json({ message: 'Error saving log', error: err.message });
  }
});

// ======= Schema & Model =======
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// ======= API Routes =======

// ✅ This is where your POST /logs route goes:
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    const ip = getClientI(req); // <-- Grab real IP

    const log = new AccessLog({ email, ip, result });
    await log.save();

    res.status(201).json({ message: 'Log saved', ipUsed: ip });
  } catch (err) {
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

// Optional: For debug/testing
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving logs', error: err });
  }
});

app.get('/', (req, res) => {
  res.send('✅ FYP MongoDB Logging Server is running!');
});

// ======= Start Server =======
app.listen(PORT, () => {
  console.log(`✅ FYP Server running on http://localhost:${PORT}`);
});
