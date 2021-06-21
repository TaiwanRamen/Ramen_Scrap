const userAgents = require('./userAgents.json');
const referers = require('./referers.json')

const saveRandom = async (page) => {

    try {
        const randomReferer = referers[Math.floor(Math.random() * referers.length)];
        const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomAgent);
        await page.setDefaultTimeout(30 * 1000);
        await page.setExtraHTTPHeaders({
            'referer': randomReferer,
        });
        await page.setDefaultNavigationTimeout(5000);
    } catch (e) {
        console.log("in saveRandom", e)
    }

}

module.exports = saveRandom;