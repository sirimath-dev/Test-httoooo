import config from '../config.js';

export default {
  command: 'menu',
  async execute(sock, msg) {
    const menu = `╭━━〔 👑 ${config.BOT_NAME} 〕━━╮
┃  ⚡ COMMANDS
┃  ▸ .menu
┃  ▸ .ping
┃  ▸ .alive
┃
┃  💾 MongoDB
┃  🌐 Web Pairing Portal
┃  🔌 Plugin System
╰━━━━━━━━━━━━━━━━╯

POWERED BY SIRIMATH DEV </>`;
    await sock.sendMessage(msg.key.remoteJid, { text: menu }, { quoted: msg });
  }
};
