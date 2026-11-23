import 'dotenv/config';

const config = {
  BOT_NAME: process.env.BOT_NAME || 'QUEEN ZARA',
  PREFIX: process.env.PREFIX || '.',
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '').replace(/\D/g, ''),
  MONGO_URI: process.env.MONGO_URI || '',
  PAIRING_WEB_PIN: process.env.PAIRING_WEB_PIN || '',
  PORT: Number(process.env.PORT || 3000)
};

export default config;
