require('dotenv').config()
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const Store = require('./models/store');
const {createCursor, path} = require("ghost-cursor");
const fs = require('fs');

const mongoose = require('mongoose');

const setRandom = require("./random/setRandom");

const scrap = async (store) => {

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

    // if (proxy) {
    //     args.push(`--proxy-server=${proxy}`)
    // }

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
            // `--proxy-server=${proxy}`
        ],
        defaultViewport: {
            width,
            height
        },
    }
    const browser = await puppeteer.launch(headless);
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.google.com/maps", ["geolocation", "notifications"]);
    let page = await browser.newPage();
    await page.setViewport({width: width, height: height});
    await setRandom(page);

    try {
        await page.goto('https://www.google.com.tw/maps');
        await page.waitForTimeout(2000)
        console.log(await page.$('ml-promotion-heading-id') !== null)
        console.log(await page.$('#app > div.mapsLiteJsStart__container.mapsLiteJsStart__ml-start-container') !== null)
        let reloadTimes = 0
        while (await page.$('ml-promotion-heading-id') !== null ||
        await page.$('#app > div.mapsLiteJsStart__container.mapsLiteJsStart__ml-start-container') !== null || reloadTimes > 10) {
            await page.close()
            page = await browser.newPage();
            await page.goto('https://www.google.com.tw/maps');
            await page.waitForTimeout(1000)
            reloadTimes++
        }


        await page.waitForSelector('#searchboxinput')
        const from = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * width)}
        const to = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)}
        await path(from, to)

        let searchBox = await page.$('#searchboxinput');
        const cursor = createCursor(page)
        await cursor.click(searchBox)

        let name = store.name.replace(/\(\S+\)/, "")
        console.log(name)
        await page.keyboard.type(name, {delay: Math.floor(Math.random() * 300)});
        await searchBox.click()
        await page.keyboard.press('Enter');

        //????????????????????????????????????
        await page.waitForTimeout(1000)
        if ((await page.$('#pane > div > div.widget-pane-content > div > div > div.section-layout.section-scrollbox')) !== null) {
            // let theFirst = await page.$('#pane > div > div.widget-pane-content > div > div > div.section-layout.section-scrollbox > div.section-layout.section-scrollbox > div:nth-child(3) > div > a')
            // await theFirst.click();

            let theFirst = await page.$x('//*[@id="pane"]/div/div[1]/div/div/div[4]/div[1]/div[3]/div/a')
            await theFirst[0].click();
        }

        //??????????????????
        await page.waitForSelector('div.OqCZI.gm2-body-2.WVXvdc > div.n2H0ue-RWgCYc.hH0dDd.PcZHt-KW5YQd')
        let openBtn = await page.$('div.OqCZI.gm2-body-2.WVXvdc > div.n2H0ue-RWgCYc.hH0dDd.PcZHt-KW5YQd');
        if (openBtn !== null) {
            await cursor.click(openBtn);
            await page.waitForSelector('div.OqCZI.gm2-body-2.WVXvdc.hE0Yed-dropdown-open > div.LJKBpe-open-R86cEd-haAclf.t39EBf-Tydcue')
            let openTimeDiv = await page.$('div.OqCZI.gm2-body-2.WVXvdc.hE0Yed-dropdown-open > div.LJKBpe-open-R86cEd-haAclf.t39EBf-Tydcue');
            let openTimeText = await page.evaluate(element => element.getAttribute('aria-label'), openTimeDiv); //*************????????????*************
            console.log(openTimeText)
            store.openPeriodText = openTimeText;
        }


        await Store.findOneAndUpdate(
            {_id: store._id},
            store
        );

        await page.close()
        await page.waitForTimeout(500);

    } catch (error) {
        console.log('error in fb_scrap.js')
        console.log(error)
    } finally {
        await browser.close();
    }
}

//do it randomly
module.exports = async () => {
    try {
        const allStores = await Store.find({openPeriodText: null}, {
            _id: 1,
            name: 1
        });
        let mySet = new Set([]);

        let allStoreLength = allStores.length

        while (mySet.size < allStores.length) {
            let index = Math.floor(Math.random() * allStoreLength);
            if (!mySet.has(index)) {
                await scrap(allStores[index])
                mySet.add(index)
            }
        }
        console.log("end")

    } catch (err) {
        console.log(err)
    }
}

