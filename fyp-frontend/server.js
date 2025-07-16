// server.js
const express = require('express');[]
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
};
const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define log schema
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// Endpoint to receive and store access logs
app.post('/logs', async (req, res) => {
  try {
    let { email, ip, result } = req.body;

    if (!ip || ip === 'unknown') {
      ip = getClientIP(req);
    }

    const log = new AccessLog({ email, ip, result });
    await log.save();
    res.status(201).json({ message: 'Log saved', ipUsed: ip });
  } catch (err) {
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});


// Endpoint to retrieve all access logs
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
// Start the server
app.listen(PORT, () => {
  console.log(`✅ FYP Server is running on http://localhost:${PORT}`);
});


