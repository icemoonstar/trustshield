<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

const app = express();
app.set('trust proxy', true); 
const PORT = 4000;

// ======= Middleware =======
app.use(cors());
app.use(bodyParser.json());

// ======= Load ENV =======
const MONGODB_URI = process.env.MONGODB_URI;
const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_CONFIG);

// ======= Firebase Setup =======
admin.initializeApp({
  credential: admin.credential.cert(FIREBASE_CONFIG),
});
const firestore = admin.firestore();

// ======= MongoDB Setup =======
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ======= Schema & Model =======
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// ======= Helper: Get Client IP =======
const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.connection?.remoteAddress ||
  'unknown';

// ======= Routes =======
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    const ip = getClientIp(req);
    const timestamp = new Date();

    // Save to MongoDB
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();

    // Save to Firestore
    await firestore.collection('logs').add({
      email,
      ip,
      result,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    });

    console.log(`✅ Logged: ${email} - ${result} - ${ip}`);
    res.status(201).json({ message: 'Log saved to both DBs', ip });

  } catch (err) {
    console.error('❌ Logging failed:', err);
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving logs', error: err });
  }
});

app.get('/', (req, res) => {
  res.send('✅ FYP MongoDB Logging Server is running!');
});

app.listen(PORT, () => {
  console.log(`✅ FYP Server running on http://localhost:${PORT}`);
});
=======

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// ===== MongoDB connection =====
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== Schemas =====
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

// Schema for IDS failed login attempts
const failedLoginSchema = new mongoose.Schema({
  email: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});
const FailedLogin = mongoose.model('FailedLogin', failedLoginSchema);

// ===== Helper: Get client IP address =====
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// ===== POST /logs - Store access logs =====
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    const ip = getClientIp(req);
    const timestamp = new Date();

    // Save to MongoDB
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();

    console.log(`✅ Logged: ${email} - ${result} - ${ip}`);
    res.status(201).json({ message: 'Log saved', ip });
  } catch (err) {
    console.error('❌ Logging failed:', err);
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

// ===== POST /failed-login - Track failed login attempts for IDS =====
app.post('/failed-login', async (req, res) => {
  try {
    const { email } = req.body;
    const ip = getClientIp(req);
    if (!email) return res.status(400).json({ message: 'Email required' });

    // Save failed attempt to database
    await new FailedLogin({ email, ip }).save();

    // Count failed attempts in the last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failCount = await FailedLogin.countDocuments({
      email,
      timestamp: { $gte: tenMinsAgo }
    });

    console.log(`⚠️ [IDS] ${email} failed attempts in last 10 mins: ${failCount}`);

    res.json({ message: 'Failed login recorded', failCount });
  } catch (err) {
    console.error('❌ Failed login logging failed:', err);
    res.status(500).json({ message: 'Error recording failed login', error: err });
  }
});

// ===== GET /logs - Retrieve all access logs =====
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving logs', error: err });
  }
});

// ===== GET /get-ip - Retrieve client IP address =====
app.get('/get-ip', (req, res) => {
  res.json({ ip: getClientIp(req) });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ FYP Server is running on http://localhost:${PORT}`);
});

>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
