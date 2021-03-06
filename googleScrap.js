require('dotenv').config()
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const mongoose = require('mongoose');
const storeScrap = require('./storeScrap');
const {createCursor} = require("ghost-cursor");


const go = async (proxy) => {
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
    // Viewport && Window size
    const width = 1375;
    const height = 800;

    let args = [
        '--incognito',
        '--disable-features=site-per-process',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors'
    ];

    if (proxy) {
        args.push(`--proxy-server=${proxy}`)
    }

    const headless = {
        headless: true,
        ignoreHTTPSErrors: true,
        args: args,
        defaultViewport: null,
    };
    const normal = {
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
            `--window-size=${width},${height}`,
            '--disable-features=site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
        defaultViewport: {
            width,
            height
        },
    }

    const browser = await puppeteer.launch(normal)

    try {
//==========================================================================================
//check for run time
//==========================================================================================
        const {PerformanceObserver, performance} = require('perf_hooks');
        const obs = new PerformanceObserver((items) => {
            console.log('PerformanceObserver A to B', items.getEntries()[0].duration);
            performance.clearMarks();
        });
        obs.observe({entryTypes: ['measure']});
        let a = performance.now();
//==========================================================================================
//check for run time
//==========================================================================================
        const context = browser.defaultBrowserContext();
        await context.overridePermissions("https://www.google.com/maps", ["geolocation", "notifications"]);
        let page = await browser.newPage();
        await page.setViewport({width: width, height: width});

        await page.goto(process.env.MAP_URL);
        await page.waitForXPath('//*[@id="legendPanel"]/div/div/div[2]/div/div/div[2]')
        const cursor = createCursor(page)

        //?????????????????????
        const moreBtns = await page.$$('#legendPanel > div > div > div > div > div > div> div > div > div> div> span');
        for (moreBtn of moreBtns) {
            await cursor.click(moreBtn)
        }
        const regions = await page.$$('#legendPanel > div > div > div > div > div > div > div > div > div.HzV7m-pbTTYe-r4nke');


        for (let i = 0; i < regions.length - 1; i++) {
            let regionName = await page.evaluate(element => element.innerText, regions[i]); //*************??????*************
            const stores = await page.$$(`#legendPanel > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(${i + 1}) > div >div:nth-child(3) > div.pbTTYe-ibnC6b-d6wfac`);

            for (let j = 0; j < stores.length - 1; j++) {
                console.log(`${regionName}?????????${j}??????`)
                await storeScrap(browser, page, cursor, stores[j], regionName);
            }
        }
//==========================================================================================
//check for run time end
//==========================================================================================
        console.log('\n')
        console.log('==========================================================================================')
        console.log("||                  Finish scraping store information                                   ||")
        console.log("||                           Process Complete!                                          ||")
        console.log('=========================================================================================')
        let b = performance.now();
        console.log('It took ' + (b - a) + ' ms.');
    } catch (error) {
        console.log('error in fb_scrap.js')
        console.log(error)
    } finally {
        await browser.close();
    }
}

module.exports = go;
