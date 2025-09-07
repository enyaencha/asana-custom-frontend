require('dotenv').config();

module.exports = {
    PORT: process.env.LOCAL_PORT || 3002,
    MAIN_SERVER_URL: process.env.MAIN_SERVER_URL || 'http://localhost:3001/api'
};