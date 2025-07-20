<<<<<<< HEAD
require('dotenv').config();
=======
>>>>>>> ae8088eda9f87c0f793af21a3511795ddd80c443
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
<<<<<<< HEAD
const admin = require('firebase-admin');

const app = express();
app.set('trust proxy', true); 

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
=======

const app = express();
app.set('trust proxy', true); 
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
//==============
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();


// ======= MongoDB Setup =======
const mongoURI = 'mongodb+srv://fypadmin:fyp123456@cluster0.icunsh3.mongodb.net/trustshield?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
>>>>>>> ae8088eda9f87c0f793af21a3511795ddd80c443
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

<<<<<<< HEAD
// ======= Helper: Get Client IP =======
=======
// ======= IP Helper =======
>>>>>>> ae8088eda9f87c0f793af21a3511795ddd80c443
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

<<<<<<< HEAD
    // Save to MongoDB
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();

    // Save to Firestore
=======
   
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();

    
>>>>>>> ae8088eda9f87c0f793af21a3511795ddd80c443
    await firestore.collection('logs').add({
      email,
      ip,
      result,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    });

<<<<<<< HEAD
    console.log(`✅ Logged: ${email} - ${result} - ${ip}`);
=======
    console.log('✅ Logged to MongoDB & Firestore');
>>>>>>> ae8088eda9f87c0f793af21a3511795ddd80c443
    res.status(201).json({ message: 'Log saved to both DBs', ip });

  } catch (err) {
    console.error('❌ Logging failed:', err);
    res.status(500).json({ message: 'Error saving log', error: err });
  }
});

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

app.listen(PORT, () => {
  console.log(`✅ FYP Server running on http://localhost:${PORT}`);
});
