# QUEEN ZARA — Web Pairing + WhatsApp Bot + MongoDB

## What is included
- Public-facing pairing website (`public/index.html`)
- Pairing code API protected by a private PIN
- Rate limit on pairing requests
- WhatsApp Baileys connection and reconnect handling
- MongoDB user/message counters
- Plugin system (`.menu`, `.ping`, `.alive`)
- Public basic connection status and usage statistics endpoints

## Requirements
- Node.js 20+
- MongoDB Atlas URI or MongoDB server
- A domain/hosting service that supports persistent Node.js processes and HTTPS

## Local setup
1. Extract this ZIP and enter the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env`:
   - Set `MONGO_URI` to your MongoDB connection string.
   - Set `PAIRING_WEB_PIN` to a strong, private PIN (at least 8 characters).
   - Set `PORT` if your host requires a specific port.
5. Start the bot:
   ```bash
   npm start
   ```
6. Open `http://localhost:3000` in your browser.

## Pairing instructions
1. Enter your WhatsApp number including country code, digits only (Sri Lanka example format: `947XXXXXXXX`).
2. Enter your private pairing PIN.
3. Select **GENERATE PAIRING CODE**.
4. On the same WhatsApp account, open **Linked devices → Link a device → Link with phone number instead** and enter the code promptly.

Only link an account you own or are authorized to use. Never share the pairing code, PIN, `.env`, or `session/` directory.

## Deploying publicly
- Use a Node.js host that supports long-running processes and persistent storage/volumes.
- Configure all `.env` values in the host's environment-variable settings.
- Enable HTTPS.
- Keep the `session/` directory on persistent storage; otherwise a redeploy/restart may lose the linked session.
- Do not publish your `.env` file or commit the `session/` folder.
- Keep the pairing PIN private. The API is rate-limited, but the PIN is still a secret.
- Do not deploy this on a static-only host such as a plain static site bucket; it needs a running Node.js backend.

## API endpoints
- `GET /api/status` — basic WhatsApp connection status.
- `GET /api/stats` — aggregate user/message counts.
- `POST /api/pair` — requires JSON `{ "phone": "947XXXXXXXX", "pin": "your-private-pin" }`.

## Add a plugin
Create `plugins/hello.js`:
```js
export default {
  command: 'hello',
  async execute(sock, msg, args) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: 'Hello from QUEEN ZARA!'
    }, { quoted: msg });
  }
};
```
Restart the bot after adding a plugin.

## Troubleshooting
- `MONGO_URI is missing`: create `.env` and add the MongoDB connection URI.
- `Pairing page is not configured`: set a private `PAIRING_WEB_PIN` in `.env`.
- `WhatsApp connection is starting`: wait for the connection state to initialize and retry.
- `A WhatsApp account is already linked`: the session is already registered. Do not delete it unless you intentionally want to unlink/relink the bot account.
