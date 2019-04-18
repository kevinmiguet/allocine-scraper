import * as puppeteer from 'puppeteer';
import { browserOptions } from './main';

const advertiseSelector = '#wbdds_insertion_116888_interstitial_close_button';
const isAdvertisePage = (_page: puppeteer.Page) => _page.evaluate(selector => Boolean(document.querySelector(selector)), advertiseSelector);
const abortUselessRequests = (request: puppeteer.Request) => {
    if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
        request.abort();
    } else {
        request.continue();
    }
};
// get the source code of one page
const getSourceCode = async(url: string, browser: puppeteer.Browser): Promise<string> => {
    console.log('getting source code of ' + url);
    let page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', abortUselessRequests);
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    // issue handling
    if (await isAdvertisePage(page)) {
        await page.click(advertiseSelector);
    }
    // get source
    return await page.content();
};
const n = 11; // 11 should do
export const getAllSourceCodes = async(): Promise<string[]> => {
    const browser = await puppeteer.launch(browserOptions);
    console.log('starting to get source code');
    return Promise.all([...Array(n).keys()]
    // get the sources on all pages in parallel
    .map(nb => getSourceCode(`http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=${nb}`, browser)))

    // once job has been done on all pages
    // close the browser and return the results
    .then(sources => {
        browser.close();
        return sources;
    });
};
