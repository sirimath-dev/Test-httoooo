import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import P from 'pino';
import fs from 'node:fs';
import { saveUser } from './database.js';
import config from '../config.js';

let sock;
let connecting = false;
let connectionStatus = 'offline';
let lastError = null;
let pairingInProgress = false;

export function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    connected: connectionStatus === 'online',
    pairingInProgress,
    lastError
  };
}

export async function requestPairingCode(phoneNumber) {
  if (!sock || connectionStatus === 'offline') {
    throw new Error('WhatsApp connection is starting. Wait a few seconds and try again.');
  }
  if (sock.authState?.creds?.registered) {
    throw new Error('A WhatsApp account is already linked. Remove the session folder and restart only if you intend to unlink it.');
  }
  if (pairingInProgress) {
    throw new Error('A pairing request is already in progress. Please wait.');
  }

  pairingInProgress = true;
  try {
    const code = await sock.requestPairingCode(phoneNumber);
    return code;
  } finally {
    setTimeout(() => { pairingInProgress = false; }, 15000).unref?.();
  }
}

export async function startWhatsApp() {
  if (connecting) return;
  connecting = true;

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['QUEEN ZARA', 'Chrome', '1.0.0']
  });

  // Keep a reference to auth state for checking whether the account is linked.
  sock.authState = state;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      connectionStatus = 'online';
      lastError = null;
      console.log('👑 QUEEN ZARA WhatsApp connected');
    }

    if (connection === 'connecting') connectionStatus = 'connecting';

    if (connection === 'close') {
      connectionStatus = 'offline';
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        lastError = 'Session logged out. Remove session folder and pair again.';
        console.log(lastError);
        connecting = false;
      } else {
        console.log('WhatsApp disconnected; reconnecting...');
        connecting = false;
        setTimeout(() => startWhatsApp().catch(err => {
          lastError = err.message;
          console.error(err);
        }), 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) continue;

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        '';

      if (!body) continue;

      try {
        await saveUser(jid);
        if (!body.startsWith(config.PREFIX)) continue;
        const parts = body.slice(config.PREFIX.length).trim().split(/\s+/);
        const command = (parts.shift() || '').toLowerCase();
        if (!command) continue;

        const plugin = plugins.get(command);
        if (plugin) await plugin.execute(sock, msg, parts, body);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    }
  });

  connecting = false;
  return sock;
}

// Load plugins once at startup.
import fsPath from 'node:path';
import { pathToFileURL } from 'node:url';
const plugins = new Map();

export async function loadPlugins() {
  const directory = fsPath.resolve('./plugins');
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.js'))) {
    const imported = await import(pathToFileURL(fsPath.join(directory, file)).href);
    if (imported.default?.command && typeof imported.default.execute === 'function') {
      plugins.set(imported.default.command.toLowerCase(), imported.default);
      console.log(`🔌 Loaded plugin: ${imported.default.command}`);
    }
  }
}
