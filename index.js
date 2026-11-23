import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import { connectDB, getStats } from './lib/database.js';
import { startWhatsApp, loadPlugins, getWhatsAppStatus, requestPairingCode } from './lib/whatsapp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pairLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many pairing attempts. Please wait 15 minutes.' }
});

function requirePairPin(req, res, next) {
  if (!config.PAIRING_WEB_PIN || config.PAIRING_WEB_PIN === 'CHANGE-THIS-TO-A-LONG-RANDOM-PIN') {
    return res.status(503).json({ success: false, error: 'Pairing page is not configured. Set a private PAIRING_WEB_PIN in .env.' });
  }
  const pin = String(req.body?.pin || '');
  if (pin.length < 8 || pin !== config.PAIRING_WEB_PIN) {
    return res.status(401).json({ success: false, error: 'Incorrect pairing PIN.' });
  }
  next();
}

app.get('/api/status', (_req, res) => {
  res.json({ success: true, bot: config.BOT_NAME, ...getWhatsAppStatus() });
});

app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await getStats();
    res.json({ success: true, ...stats });
  } catch {
    res.status(500).json({ success: false, error: 'Could not load statistics.' });
  }
});

app.post('/api/pair', pairLimiter, requirePairPin, async (req, res) => {
  const phone = String(req.body?.phone || '').replace(/\D/g, '');
  if (!/^[1-9]\d{7,14}$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'Enter a valid phone number with country code, digits only. Example: 947XXXXXXXX' });
  }
  try {
    const code = await requestPairingCode(phone);
    res.json({ success: true, code, message: 'Enter this code on your phone in WhatsApp Linked devices.' });
  } catch (error) {
    res.status(409).json({ success: false, error: error.message });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

await connectDB();
await loadPlugins();
await startWhatsApp();

app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`🌐 QUEEN ZARA web running on port ${config.PORT}`);
});
