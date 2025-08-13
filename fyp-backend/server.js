// ===== server.js =====
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');
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

// ===== Helper: Get client IP =====
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'];
  if (ip) {
    ip = ip.split(',')[0].trim(); // 取第一个真实 IP
  } else {
    ip = req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
  }
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  return ip;
}

// ===== Resend Init =====
const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Firebase Admin SDK Init  =====
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!serviceAccount.private_key) throw new Error('private_key missing');
} catch (err) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
  process.exit(1); 
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


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
  console.log("📥 /failed-login POST request received");
  console.log("📩 Request body:", req.body);

  try {
    let { email } = req.body;
    const ip = getClientIp(req);
    console.log("📡 Detected IP:", ip);

    if (typeof email !== "string" || !email.trim()) {
      console.warn("⚠️ Invalid email format received:", email);
      return res.status(400).json({ message: 'Invalid email format' });
    }
    email = email.trim();

    await new FailedLogin({ email, ip }).save();
    await firestore.collection("logs").add({
      email, ip, result: "failed", timestamp: new Date()
    });

    console.log(`✅ Saved failed login for ${email} (${ip})`);

    // Count failed attempts in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failCount = await FailedLogin.countDocuments({
      email, timestamp: { $gte: tenMinsAgo }
    });

    console.log(`⚠️ [IDS] ${email} failed attempts in last 10 mins: ${failCount}`);

    // Alert admins if threshold exceeded
    const threshold = 3;
    if (failCount >= threshold) {
      try {
        const adminUsersSnapshot = await firestore.collection('users').where('role', '==', 'admin').get();
        const adminEmails = [];
        adminUsersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.email) adminEmails.push(data.email);
        });

        if (adminEmails.length > 0) {
          await resend.emails.send({
            from: 'alert@resend.dev', 
            to: adminEmails,
            subject: `🚨 Security Alert: Multiple Failed Logins for ${email}`,
            text: `Attention:\n\nThere have been ${failCount} failed login attempts for ${email} from IP ${ip} within the last 10 minutes.\n\nPlease investigate immediately.`
          });
          console.log(`📧 Alert emails sent to: ${adminEmails.join(', ')}`);
        } else {
          console.warn('⚠️ No admin emails found in Firestore to send alert');
        }
      } catch (emailErr) {
        console.error('❌ Failed to send alert email:', emailErr.message);
      }
    }

    res.json({ message: 'Failed login recorded', failCount });
  } catch (err) {
    console.error("❌ Error in /failed-login:", err.stack);
    res.status(500).json({ message: 'Error recording failed login', error: err.message });
  }
});

// ===== GET /failed-login - Debug route =====
app.get('/failed-login', (req, res) => {
  res.json({ message: '✅ failed-login API is working' });
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
