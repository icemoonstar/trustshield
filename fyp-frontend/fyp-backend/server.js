<<<<<<< HEAD
console.log("1");
=======
<<<<<<< HEAD
// ===== server.js =====
=======

>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
<<<<<<< HEAD
const { Resend } = require('resend'); // ✅ Resend SDK
const admin = require('firebase-admin'); // ✅ Firestore Admin SDK
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 4000;
=======

const app = express();
const PORT = 4000;
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16

app.use(cors());
app.use(bodyParser.json());

// ===== MongoDB connection =====
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
<<<<<<< HEAD
  .catch(err => console.error('❌ MongoDB connection error:', err.message));
=======
  .catch(err => console.error('❌ MongoDB connection error:', err));
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16

// ===== Schemas =====
const accessLogSchema = new mongoose.Schema({
  email: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  result: String
});
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

<<<<<<< HEAD
// Schema for IDS failed login attempts
=======
<<<<<<< HEAD
=======
// Schema for IDS failed login attempts
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
const failedLoginSchema = new mongoose.Schema({
  email: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});
const FailedLogin = mongoose.model('FailedLogin', failedLoginSchema);

<<<<<<< HEAD
=======
<<<<<<< HEAD
// ===== Helper: Get client IP =====
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  return ip;
}

// ===== Resend Init =====
const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Firebase Admin SDK Init =====
admin.initializeApp({
  credential: admin.credential.applicationDefault() 
});
const firestore = admin.firestore();

=======
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
// ===== Helper: Get client IP address =====
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

<<<<<<< HEAD
=======
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
// ===== POST /logs - Store access logs =====
app.post('/logs', async (req, res) => {
  try {
    const { email, result } = req.body;
    const ip = getClientIp(req);
<<<<<<< HEAD
=======
<<<<<<< HEAD

    if (!email || !result) {
      return res.status(400).json({ message: 'Email and result are required' });
    }

  
    await new AccessLog({ email, ip, result }).save();

    
    await firestore.collection("logs").add({
      email,
      ip,
      result,
      timestamp: new Date()
    });
=======
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
    const timestamp = new Date();

    // Save to MongoDB
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();
<<<<<<< HEAD
=======
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862

    console.log(`✅ Logged: ${email} - ${result} - ${ip}`);
    res.status(201).json({ message: 'Log saved', ip });
  } catch (err) {
<<<<<<< HEAD
=======
<<<<<<< HEAD
    console.error('❌ Logging failed:', err.stack);
    res.status(500).json({ message: 'Error saving log', error: err.message });
  }
});

// ===== POST /failed-login - IDS Failed login attempts =====
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
      email,
      ip,
      result: "failed",
      timestamp: new Date()
    });

    console.log(`✅ Saved failed login for ${email} (${ip})`);

    // Count failed attempts in last 10 minutes
=======
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
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
<<<<<<< HEAD
=======
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failCount = await FailedLogin.countDocuments({
      email,
      timestamp: { $gte: tenMinsAgo }
    });

    console.log(`⚠️ [IDS] ${email} failed attempts in last 10 mins: ${failCount}`);

<<<<<<< HEAD
=======
<<<<<<< HEAD
    // === Trigger email alert if threshold exceeded ===
    const threshold = 3;

    if (failCount >= threshold) {
      try {
        const adminUsersSnapshot = await firestore.collection('users').where('role', '==', 'admin').get();
        const adminEmails = [];
        adminUsersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.email) adminEmails.push(data.email);
        });

        if (adminEmails.length === 0) {
          console.warn('⚠️ No admin emails found in Firestore to send alert');
        } else {
          await resend.emails.send({
            from: 'alert@resend.dev', 
            to: adminEmails,
            subject: `🚨 Security Alert: Multiple Failed Logins for ${email}`,
            text: `Attention:\n\nThere have been ${failCount} failed login attempts for ${email} from IP ${ip} within the last 10 minutes.\n\nPlease investigate immediately.`
          });

          console.log(`📧 Alert emails sent to: ${adminEmails.join(', ')}`);
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

// ===== GET /logs - Retrieve logs =====
app.get('/logs', async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error("❌ Error retrieving logs:", err.stack);
    res.status(500).json({ message: 'Error retrieving logs', error: err.message });
  }
});

// ===== GET /get-ip - Retrieve client IP =====
=======
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
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
<<<<<<< HEAD
=======
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
app.get('/get-ip', (req, res) => {
  res.json({ ip: getClientIp(req) });
});

// ===== Start server =====
app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`✅ FYP Server running on port ${PORT}`);
});
=======
  console.log(`✅ FYP Server is running on http://localhost:${PORT}`);
});

<<<<<<< HEAD
=======
>>>>>>> 470fcea682ee80023058bc56ab3c6aa360a01d16
>>>>>>> f37c6b2f31c07834dd484bb6380e05ac67392862
