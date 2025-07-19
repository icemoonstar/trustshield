const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.set('trust proxy', true); // ⭐ 添加
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

// ======= IP Helper =======
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

    // MongoDB 写入
    const mongoLog = new AccessLog({ email, ip, result, timestamp });
    await mongoLog.save();

    // Firestore 写入
    await firestore.collection('logs').add({
      email,
      ip,
      result,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    });

    console.log('✅ Logged to MongoDB & Firestore');
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
