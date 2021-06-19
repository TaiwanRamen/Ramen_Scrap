const axios = require("axios"),
    jsdom = require('jsdom');

module.exports = async () => {
    const options = {
        method: 'GET',
        url: 'https://www.us-proxy.org/'
    }
    const response = await axios(options);
    const dom = new jsdom.JSDOM(response.data)

    const element = dom.window.document.querySelector('#raw > div > div > div.modal-body > textarea')
    if (element) {
        const proxysText = element.innerHTML;
        return proxysText.match(/\b((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:(?<!\.)\b|\.)){4}\:\d{2,5}/g)
    }
    return []
}