const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
    require('dotenv').config();
}
const express = require('express'),
    googleScrap = require('./googleScrap');

const app = express();

app.get('/scrap', async (req, res) => {
    try {
        let trustedIps = process.env.TRUSTED_IP.split(',');
        const requestIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (trustedIps.indexOf(requestIP) >= 0) {
            await googleScrap()
            return res.status(200).json({
                requestIP: requestIP,
                message: "success"
            })
        } else {
            throw new Error('not accepted IP')
        }
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }
});


app.get('/:else', (req, res) => {
    res.send("No such pass exist.");
})

//handle http server and socket io
const PORT = process.env.PORT;

const server = app.listen(PORT, console.log(`Server started on port ${PORT}`));