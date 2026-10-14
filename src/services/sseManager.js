/**
 * Server-Sent Events (SSE) Manager for Real-Time Live Feed
 */
class SseManager {
  constructor() {
    this.clients = new Set();

    // Send periodic heartbeats to prevent idle connection timeout
    const interval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
    if (interval.unref) interval.unref();
  }

  addClient(res, user = null) {
    this.clients.add(res);

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({
      message: 'Connected to Innovative Data Platform live feed',
      timestamp: new Date().toISOString(),
      clientCount: this.clients.size
    })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event, payload) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  sendHeartbeat() {
    for (const client of this.clients) {
      try {
        client.write(': heartbeat\n\n');
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

const sseManager = new SseManager();
module.exports = sseManager;
