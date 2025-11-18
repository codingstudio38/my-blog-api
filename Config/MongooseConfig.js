const database = process.env.DATABASE_NAME;
const mongooseConnect = require('mongoose');
mongooseConnect.set('strictQuery', false);
mongooseConnect.connect(database)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err.message));
module.exports = mongooseConnect;  