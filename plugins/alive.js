import config from '../config.js';

export default {
  command: 'alive',
  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `👑 ${config.BOT_NAME}\n\n✅ BOT IS ALIVE!\n⚡ Status: ONLINE\n💾 Database: MongoDB\n🌐 Pairing Website: Enabled\n\nPOWERED BY SIRIMATH DEV </>`
    }, { quoted: msg });
  }
};
