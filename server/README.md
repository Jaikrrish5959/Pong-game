# Pong Game - Web Multiplayer Edition (Node.js/Express/Socket.IO)

Server-authoritative multiplayer Pong. Serves the client from `../public` and runs the game physics loop at 60Hz.

## Run

```bash
cd server
npm install
PORT=3001 node server.js
```

- Default port is `3000` (`PORT` env var overrides it — use another port if `3000` is already in use).
- `npm start` / `npm run dev` are equivalent to `node server.js`.

Then open `http://localhost:3001` in a browser. Other devices on the same LAN can join via the URL/QR code shown at `http://localhost:3001/api/lan-info`.

## Verify it's running

```bash
curl http://localhost:3001/api/health
# {"status":"ok","rooms":0}
```
