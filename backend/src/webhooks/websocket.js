const { sendMessageToClient } = require("../utils/helpers");
const { saveMessage } = require("../db/models");
const WebSocket = require("ws"); // Make sure this points to your actual DB models

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
        const res = JSON.parse(data);
        if (res.action === 'sendMessage') {
            const {rows} = await saveMessage('', res.data.message, true, res.data.clientId); // Adjust based on your DB model

            ws.send(JSON.stringify({
                action: 'acknowledgeMessage',
                data: { tempMessageId: res.data.tempMessageId, permanentId: rows[0].id, clientId: res.data.clientId }
            }));

            sendMessageToClient(res.data.userId, res.data.message);
        }
        if (res.action === 'ping') {
            ws.send(JSON.stringify({
                action: 'pong'
            }))
        }
    });
});

// Broadcast function to send a message to all connected clients
const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                action: 'newMessage',
                data: JSON.stringify(data)
            }));
        }
    });
};

module.exports = {
    broadcast
};
