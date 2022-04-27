require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.static('public'));
app.use(cors());

const reportController = require('./controllers/reportController');

app.get('/api/reports', reportController.getReports);
app.get('/api/reports/:reportId', reportController.getReportById);

if (!process.env.PORT) {
    process.env.PORT = 8080;
}

app.listen(process.env.PORT, () => {
    console.log(`App listening on port ${process.env.PORT}`)
})