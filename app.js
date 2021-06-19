const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
    require('dotenv').config();
}
const express = require('express'),
    googleScrap = require('./googleScrap'),
    getProxy = require('./getProxys');

const app = express();

app.get('/scrap', async (req, res) => {

    try {
        const requestIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (process.env.TRUSTED_IPS !== undefined) {
            let trustedIps = process.env.TRUSTED_IPS.split(',');
            if (trustedIps.indexOf(requestIP) >= 0) {
                console.log("start scarp with accepted ip")
                googleScrap();
                res.status(200).json({
                    requestIP: requestIP,
                    message: "success"
                })
            } else {
                throw new Error('not accepted IP')
            }
        } else {
            console.log("start scarp without accepted ip")
            googleScrap();
            res.status(200).json({
                requestIP: requestIP,
                message: "success"
            })
        }
    } catch (error) {
        console.log(error)
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

app.listen(PORT, console.log(`Server started on port ${PORT}`));