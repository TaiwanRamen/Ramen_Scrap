const request = require('request');
const axios = require("axios");

module.exports = async (proxys) => {
    let res = await axios.get('https://httpbin.org/ip')
    let origin = res.data.origin;
    console.log(origin)

    let array = [];
    try {
        for await (let proxy of proxys) {
            request({
                'url': 'https://httpbin.org/ip',
                'method': "GET",
                'proxy': `http://${proxy}`
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let parsedRes = JSON.parse(body);
                    if (origin !== parsedRes.origin) {
                        array.push(proxy)
                    }
                }
            })
        }
    } catch (error) {
        console.log(error);
    }
    return array;


}