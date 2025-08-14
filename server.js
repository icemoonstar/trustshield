// ===== server.js =====
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MongoDB connection =====
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ===== Schemas =====
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

const failedLoginSchema = new mongoose.Schema({
  email: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});
const FailedLogin = mongoose.model('FailedLogin', failedLoginSchema);

const alertSchema = new mongoose.Schema({
  email: String,
  ip: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

// ===== Helper: Get client IP =====
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'];
  if (ip) {
    ip = ip.split(',')[0].trim(); 
  } else {
    ip = req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
  }
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  return ip;
}

// ===== Firebase Init =====
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (err) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();

// ===== POST /logs =====
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    const ip = getClientIp(req);

    if (!email || !result) {
      return res.status(400).json({ message: 'Email and result are required' });
    }

    await new AccessLog({ email, ip, result }).save();
    await firestore.collection("logs").add({
      email, ip, result, timestamp: new Date()
    });

    console.log(`✅ Logged: ${email} - ${result} - ${ip}`);
    res.status(201).json({ message: 'Log saved', ip });
  } catch (err) {
    console.error('❌ Logging failed:', err.stack);
    res.status(500).json({ message: 'Error saving log', error: err.message });
  }
});

// ===== POST /failed-login =====
app.post('/failed-login', async (req, res) => {
  try {
    let { email } = req.body;
    const ip = getClientIp(req);

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    email = email.trim();

    // 记录失败登录
    await new FailedLogin({ email, ip }).save();
    await firestore.collection("logs").add({
      email, ip, result: "failed", timestamp: new Date()
    });

    // 统计最近 10 分钟失败次数
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failCount = await FailedLogin.countDocuments({
      email, timestamp: { $gte: tenMinsAgo }
    });

    console.log(`⚠️ [IDS] ${email} failed attempts in last 10 mins: ${failCount}`);

    // 阈值设置为 3 次
    const threshold = 3;
    if (failCount >= threshold) {
      const alertMessage = `登录失败超过 ${threshold} 次`;
      console.warn(`⚠️ [IDS ALERT] ${email} - ${alertMessage}`);

      // 写入 MongoDB Alert 集合
      await new Alert({ email, ip, message: alertMessage }).save();
      await firestore.collection("alerts").add({ email, ip, message: alertMessage, timestamp: new Date() });
    }

    res.json({ message: 'Failed login recorded', failCount });
  } catch (err) {
    console.error("❌ Error in /failed-login:", err.stack);
    res.status(500).json({ message: 'Error recording failed login', error: err.message });
  }
});

// ===== GET /alerts =====
app.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    console.error("❌ Error retrieving alerts:", err.stack);
    res.status(500).json({ message: 'Error retrieving alerts', error: err.message });
  }
});

// ===== GET /logs =====
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error("❌ Error retrieving logs:", err.stack);
    res.status(500).json({ message: 'Error retrieving logs', error: err.message });
  }
});

// ===== GET /get-ip =====
app.get('/get-ip', (req, res) => {
  res.json({ ip: getClientIp(req) });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ FYP Server running on port ${PORT}`);
});
