const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

// Use Render environment variable for the token
const AUTH_TOKEN = process.env.AUTH_TOKEN;
if (!AUTH_TOKEN) {
  console.error("ERROR: AUTH_TOKEN environment variable not set");
  process.exit(1);
}

wss.on('connection', ws => {
  console.log('New client connected');

  ws.on('message', raw => {
    let data;

    // Incoming messages must be JSON with { token, timestamp, message }
    try {
      data = JSON.parse(raw);
    } catch {
      console.log("Rejected: not JSON");
      return;
    }

    if (data.token !== AUTH_TOKEN) {
      console.log("Rejected: bad token");
      return;
    }

    // Broadcast only the actual text (no token leakage)
    const outgoing = JSON.stringify({
      message: data.message,
      timestamp: data.timestamp,
    });
    console.log(outgoing);

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(outgoing);
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});

console.log(`WebSocket server running on port ${port}`);