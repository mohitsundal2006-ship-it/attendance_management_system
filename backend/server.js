const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });
const { testConnection } = require('./db');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server due to database connection error.');
        console.error(error.message);
        process.exit(1);
    }
}

startServer();
