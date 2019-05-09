import * as puppeteer from 'puppeteer';
import { browserOptions, Key } from './main';
import { asyncAllLimit } from './utils/asyncLimit';
import * as fs from 'fs';
import * as tmp from './utils/temp';

const advertiseSelector = '#wbdds_insertion_116888_interstitial_close_button';
const isAdvertisePage = (_page: puppeteer.Page) => _page.evaluate(selector => Boolean(document.querySelector(selector)), advertiseSelector);
// we need this so that we only load text
const abortUselessRequests = (request: puppeteer.Request) => {
    if (['image', 'stylesheet', 'font', 'script', 'media'].indexOf(request.resourceType()) !== -1) {
        request.abort();
    } else {
        request.continue();
    }
};

const getSourceCodeOnOnePage = async(url: string, browser: puppeteer.Browser): Promise<Key> => {
    // try to get result from ram first
    const tempResult = await tmp.get(url, true);
    if (tempResult) {
        return tempResult;
    }
    let page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', abortUselessRequests);
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    // issue handling
    if (await isAdvertisePage(page)) {
        await page.click(advertiseSelector);
    }
    // get source and save it in tmp
    const source = await page.content();
    return tmp.saveAndGetKey(source, url);
};

const getSourceCode = async(urls: string[]): Promise<Key[]> => {
    const browser = await puppeteer.launch(browserOptions);
    return Promise.all(urls
    // save the sources on all pages in parallel
    // and return their Keys
    .map(url => getSourceCodeOnOnePage(url, browser)))

    // once job has been done on all pages
    // close the browser and return the Keys
    .then(sources => {
        browser.close();
        return sources;
    })

    // if it fails, we should close the browser too
    .catch((error) => {
        browser.close();
        return Promise.reject(error);
    });
};


const n = 22;
export const getAllSourceCodes = async(): Promise<Key[]> => {
    console.log('starting to get source code');
    const urls =  [...Array(n).keys()].map(nb => `http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=${nb}`);
    return asyncAllLimit(getSourceCode, urls, 5);
};


// another scenario. not used yet
export const getAllSourceCodesByGoingOnEachCinemaPage = async(): Promise<Key[]> => {
    const cinefile = fs.readFileSync('./cinemas.json', 'utf8');
    const cines = JSON.parse(cinefile);
    const cineUrls = Object.keys(cines).map(cineId => `http://www.allocine.fr/${cines[cineId].url}`);
    return asyncAllLimit(getSourceCode, [cineUrls[3]], 10);
};
