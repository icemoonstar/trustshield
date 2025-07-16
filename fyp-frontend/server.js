// ✅ server.js - Full Version with IP Fix for All Devices

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB connection
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Define log schema
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// ✅ IP Extraction Function
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const rawIP = req.connection.remoteAddress || req.socket?.remoteAddress || 'unknown';
  if (rawIP.startsWith('::ffff:')) {
    return rawIP.replace('::ffff:', '');
  }
  return rawIP;
};

// ✅ POST /logs - Store access log
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    let ip = req.body.ip || getClientIP(req);

    const log = new AccessLog({ email, ip, result });
    await log.save();

    res.status(201).json({ message: 'Log saved', ipUsed: ip });
  } catch (err) {
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

// ✅ GET /logs - Return all access logs
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving logs', error: err });
  }
});

// ✅ Test Endpoint
app.get('/', (req, res) => {
  res.send('✅ FYP MongoDB Logging Server is running!');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ FYP Server is running on http://localhost:${PORT}`);
});
