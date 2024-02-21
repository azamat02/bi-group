const chatRoutes = require('./chatRoutes');
const userRoutes = require('./userRoutes');

module.exports = (app, bot) => { // Accept the bot instance as an argument
    app.use('/api/chats', chatRoutes);
    app.use('/api/user', userRoutes(bot)); // Pass the bot instance to the userRoutes
};
