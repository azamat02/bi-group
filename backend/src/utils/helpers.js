const axios = require('axios');

function sendMessageToClient(telegramUserId, messageText) {
    const sendMessageUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
    axios.post(sendMessageUrl, {
        chat_id: telegramUserId,
        text: `<b>Консультант</b>\n\n${messageText}`,
        parse_mode: 'HTML'
    })
        .then(response => {})
        .catch(error => console.error("Error sending message", error));
}

module.exports = {
    sendMessageToClient
};
