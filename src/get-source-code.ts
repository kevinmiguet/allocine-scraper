import * as puppeteer from 'puppeteer';
import { browserOptions } from './main';
import { asyncAllLimit } from './utils/asyncLimit';

const advertiseSelector = '#wbdds_insertion_116888_interstitial_close_button';
const isAdvertisePage = (_page: puppeteer.Page) => _page.evaluate(selector => Boolean(document.querySelector(selector)), advertiseSelector);
// we need this so that we only load text
const abortUselessRequests = (request: puppeteer.Request) => {
    if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
        request.abort();
    } else {
        request.continue();
    }
};

const getSourceCodeOnOnePage = async(url: string, browser: puppeteer.Browser): Promise<string> => {
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

export const getSourceCode = async(urls: string[]): Promise<string[]> => {
    const browser = await puppeteer.launch(browserOptions);
    return Promise.all(urls
    // get the sources on all pages in parallel
    .map(url => getSourceCodeOnOnePage(url, browser)))

    // once job has been done on all pages
    // close the browser and return the results
    .then(sources => {
        browser.close();
        return sources;
    });
};


const n = 11; // 11 should do
export const getAllSourceCodes = async(): Promise<string[]> => {
    console.log('starting to get source code');
    const urls =  [...Array(n).keys()].map(nb => `http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=${nb}`);
    return asyncAllLimit(getSourceCode, urls, 5);
};
