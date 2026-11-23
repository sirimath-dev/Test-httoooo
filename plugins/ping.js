export default {
  command: 'ping',
  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: '👑 QUEEN ZARA\n\n⚡ PONG!\n✅ Bot is working.'
    }, { quoted: msg });
  }
};
