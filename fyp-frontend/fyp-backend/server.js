// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Access log schema
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// Failed login schema (IDS)
const failedLoginSchema = new mongoose.Schema({
  email: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});
const FailedLogin = mongoose.model('FailedLogin', failedLoginSchema);

app.post('/logs', async (req, res) => {
  try {
    const { email, ip, result } = req.body;
    const log = new AccessLog({ email, ip, result });
    await log.save();
    res.status(201).json({ message: 'Log saved' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

// record failed
app.post('/failed-login', async (req, res) => {
  try {
    const { email, ip } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // 存一条失败记录
    const failLog = new FailedLogin({ email, ip });
    await failLog.save();

    // failed in 10 minit
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const count = await FailedLogin.countDocuments({
      email,
      timestamp: { $gte: tenMinsAgo }
    });

    console.log(`⚠️ [IDS] ${email} 最近 10 分钟失败次数: ${count}`);

    res.json({ message: 'Failed login recorded', failCount: count });
  } catch (err) {
    res.status(500).json({ message: 'Error recording failed login', error: err });
  }
});

//  access logs
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving logs', error: err });
  }
});

// get ip
app.get('/get-ip', (req, res) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';
  res.json({ ip });
});

// service
app.listen(PORT, () => {
  console.log(`✅ FYP Server is running on http://localhost:${PORT}`);
});
