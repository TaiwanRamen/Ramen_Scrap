const Store = require('./models/store');
const geohash = require('ngeohash');
const request_client = require('request-promise-native');
const {createCursor} = require("ghost-cursor");

module.exports = async (browser, page, cursor, storeLink, regionName) => {
    //去商店的連結
    await page.waitForTimeout(process.env.DELAY_TIME)

    await cursor.click(storeLink)

    await page.waitForTimeout(process.env.DELAY_TIME)
    try {
        let storeInfo = null;
        let store = {
            name: null,
            region: regionName,
            city: null,
            descriptionHTML: "",
            location: {
                type: 'Point',
                coordinates: null,
                geoHash: "",
            },
            address: null,
            phoneNumber: "",
            openPeriod: null,
            openPeriodText: null,
            googleImages: [],
            googleUrl: null,
            storeUrl: null
        }

        await page.setRequestInterception(true);

        await page.on('request', async (request) => {
            try {
                const response = await request_client({
                    uri: request.url(),
                    resolveWithFullResponse: true,
                })
                const request_url = request.url();
                if (request_url.startsWith('https://maps.googleapis.com/maps/api/place/js/PlaceService.GetPlaceDetails')) {
                    let response_body = response.body;
                    response_body = response_body.slice(36, -1)
                    let storeInfo = await JSON.parse(response_body).result;
                    store.address = storeInfo.formatted_address;
                    store.phoneNumber = storeInfo.formatted_phone_number;
                    store.openPeriod = storeInfo.opening_hours?.periods;
                    store.openPeriodText = storeInfo.opening_hours?.weekday_text;
                    store.googleImages = storeInfo.photos?.map(photo => {
                        let photoUrl = photo.raw_reference?.fife_url;
                        return photoUrl?.slice(0, -2)
                    })
                    store.googleUrl = storeInfo?.url;
                    store.storeUrl = storeInfo?.website;
                    store.googlePlaceId = storeInfo?.place_id;
                }

            } catch (e) {
                console.error(e);
            }
        })
        store.name = await page.evaluate(element => element.innerText, storeLink); //*************店名*************

        await page.waitForTimeout(process.env.DELAY_TIME);

        //如果店家有google資料
        let googleSection = await page.$('#featurecardPanel > div > div > div.qqvbed-bN97Pc > div.qqvbed-VTkLkc.fO2voc-jRmmHf-LJTIlf');
        if (googleSection !== null) {
            let addressTag = await page.$('#featurecardPanel > div > div > div:last-child > div:nth-child(2) >div.fO2voc-jRmmHf-MZArnb-Q7Zjwb');
            if (addressTag && !store.address) {
                store.address = await page.evaluate(element => element.innerText, addressTag); //*************地址*************
            }

            let [phoneTag] = await page.$x('//*[@id="featurecardPanel"]/div/div/div[4]/div[2]/div[not(*) and not(@class)]');
            if (phoneTag && !store.phoneNumber) {
                store.phoneNumber = await page.evaluate(div1 => div1.innerText, phoneTag); //*************電話*************
            }

            let storeUrlTags = await page.$$('#featurecardPanel > div > div > div.qqvbed-bN97Pc > div.qqvbed-VTkLkc.fO2voc-jRmmHf-LJTIlf > div > a');
            if (storeUrlTags.length !== 0 && store.storeUrl === null) {
                let storeUrl = await page.evaluate(element => element.getAttribute('href'), storeUrlTags[0]);
                if (!storeUrl.startsWith("https://maps.google.com") && !storeUrl.startsWith("https://www.google.com/maps")) {
                    store.storeUrl = storeUrl;  //*************網站*************
                }
            }
            if (storeUrlTags.length !== 0 && store.googleUrl === null) {
                let googleUrlText = await page.evaluate(element => element.innerText, storeUrlTags[storeUrlTags.length - 1]);
                if (googleUrlText === "在「Google 地圖」中檢視") {

                    let googleUrl = await page.evaluate(element => element.getAttribute('href'), storeUrlTags[storeUrlTags.length - 1]); //*************google網站*************

                    //save target of original page to know that this was the opener:
                    const pageTarget = page.target();

                    await cursor.click(storeUrlTags[storeUrlTags.length - 1])
                    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
                    const newPage = await newTarget.page();
                    const nerCursor = createCursor(newPage)
                    await newPage.waitForXPath('//*[@id="pane"]/div/div[1]/div/div/div[1]/div[1]/button')
                    let photoBtn = await newPage.$(' #pane > div > div.widget-pane-content > div > div > div.F8J9Nb-LfntMc-header-HiaYvf > div.section-hero-header-image-hero-container > button')

                    await nerCursor.click(photoBtn)
                    await newPage.waitForSelector('#pane > div > div.widget-pane-content > div > div > div.section-layout.section-scrollbox > div.section-layout > div >div >a> div.gallery-image-low-res')
                    let photoLinks = await newPage.$$('#pane > div > div.widget-pane-content > div > div > div.section-layout.section-scrollbox > div.section-layout > div >div >a> div.gallery-image-low-res')
                    for (let i = 0; i < 5; i++) {
                        let googleLink = await newPage.evaluate(element => element.getAttribute('style'), photoLinks[i]); //*************google照片*************
                        store.googleImages.push(googleLink.split(`url("`)[1].split(`=w`)[0])  //******"https://lh5.googleusercontent.com/p/AF1QipOSFym4i5u5dX1d3MqhoN9r9IWgPba6s35DVjM"*****
                    }
                    await newPage.close()
                    await page.waitForTimeout(1000);

                }
            }
        }

        let url = page.url()
        let location = url.match(/\=\d*\.\d*\%2C\d*\.\d*/)
        location = location[0].match(/\d*\.\d*/g)
        if (!store.location.coordinates) {
            store.location.coordinates = [parseFloat(location[1]), parseFloat(location[0])] //  [ '25.02629050000002', '121.47718700000001' ]  前lat後lon
        }


        store.location.geoHash = geohash.encode(parseFloat(location[1]), parseFloat(location[0]), precision = 10);

        await page.waitForSelector('#featurecardPanel>div>div>div:nth-child(4)>div:nth-child(1)>div.qqvbed-p83tee');
        let descriptions = await page.$$('#featurecardPanel>div>div>div:nth-child(4)>div:nth-child(1)>div.qqvbed-p83tee');
        for (i = 2; i < descriptions.length; i++) {
            let html = await page.evaluate(element => element.innerHTML, descriptions[i]);
            html.replace('qqvbed-p83tee-V1ur5d', 'descriptionTitle');
            html.replace('qqvbed-p83tee-lTBxed', 'descriptionText')
            store.descriptionHTML = store.descriptionHTML.concat(html)  //**********文字HTML************
        }
        if (store.address) {
            let index = store.address.search(/市|縣/);
            store.city = store.address.slice(index - 2, index + 1)
        }

        console.log(store)
//=========================================================
//    存入DB
//=========================================================

        let foundStore = await Store.find({
            $or: [
                {'name': store.name},
                {'location.geoHash': store.location.geoHash}
            ]
        })
        if (foundStore.length === 0) {
            try {
                //存入DB
                console.log("new store saved", store.name)
                await Store.create([store]);
            } catch (error) {
                console.log(error)
            }

        } else if (foundStore.length === 1) {
            foundStore = foundStore[0]
            console.log(`update store ${store.name}`)
            console.log(foundStore.name, store.name)
            await Store.findOneAndUpdate(
                {_id: foundStore._id},
                store
            );
        } else {
            console.log('more than one store found, skip')
        }
        console.log("back!")
        //上一頁
        await page.waitForSelector('#featurecardPanel > div > div >div:nth-child(3) > div:nth-child(1) > div:nth-child(1)');
        let backBtn = await page.$('#featurecardPanel > div > div >div:nth-child(3) > div:nth-child(1) > div:nth-child(1)');
        await cursor.click(backBtn);
    } catch (error) {
        console.log(error)
    }
}

const compareGeoHash = (geohash1, geohash2) => {
    if (geohash1.length !== geohash2.length) return null;
    let index = 0;
    while (index < geohash1.length) {
        if (geohash1[index] === geohash2[index]) index++
        else break
    }
    return index
}
