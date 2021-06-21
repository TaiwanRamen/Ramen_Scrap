const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
    require('dotenv').config();
}
const express = require('express'),
    googleScrap = require('./googleScrap'),
    getProxy = require('./getProxys'),
    axios = require("axios"),
    storeInfo = require('./storeInfo');
const Store = require('./models/store');
const mongoose = require('mongoose');

const app = express();

app.get('/scrap', async (req, res) => {

    try {
        const serverIpRes = await axios.get('https://ipv4bot.whatismyipaddress.com/')

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
                serverIp: serverIpRes.data,
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


app.get('/storeInfo', async (req, res) => {
    try {
        storeInfo();
        res.status(200).json({
            message: "success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: error
        })
    }
});

app.get('/serverIp', async (req, res) => {

    try {
        const serverIpRes = await axios.get('https://ipv4bot.whatismyipaddress.com/');
        res.status(200).json({
            serverIp: serverIpRes.data,
            message: "success"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: error
        })
    }
})

app.get('/address', async (req, res) => {

    try {
        try {
            await mongoose.connect(process.env.DATABASE_URL_RS, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true,
                replicaSet: "rs0"
            });
            console.log('MongoDB Connected...');
        } catch (error) {
            throw new Error('connection broke');
        }
        const allStores = await Store.find({}, {
            _id: 1,
            name: 1,
            address: 1
        });
        res.status(200).json({
            message: "success"
        })
        for (let store of allStores) {
            try {
                const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
                    params: {
                        input: store.address || store.name.replace(/\(\S+\)/, ""),
                        inputtype: "textquery",
                        fields: "formatted_address",
                        language: "zh-TW",
                        key: process.env.GOOGLE_API_KEY
                    }
                });
                console.log(store.name)
                console.log(response.data.candidates[0])

                store.address = response.data.candidates[0].formatted_address;

                await Store.findOneAndUpdate(
                    {_id: store._id},
                    store
                );
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.log(e)
            }
        }
    } catch (error) {
        console.log(error)
    }
})


app.get('/:else', (req, res) => {
    res.send("No such pass exist.");
})

//handle http server and socket io
const PORT = process.env.PORT;

app.listen(PORT, console.log(`Server started on port ${PORT}`));


//337台灣桃園市大園區???