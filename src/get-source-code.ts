import * as puppeteer from 'puppeteer';
import { browserOptions } from './main';
import { asyncAllLimit } from './utils/asyncLimit';
import * as fs from 'fs';

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
    })

    // if it fails, we should close the browser too
    .catch(() => {
        browser.close();
        return Promise.reject();
    });
};


const n = 22;
export const getAllSourceCodes = async(): Promise<string[]> => {
    console.log('starting to get source code');
    const urls =  [...Array(n).keys()].map(nb => `http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=${nb}`);
    return asyncAllLimit(getSourceCode, urls, 5);
};


// another scenario. not used yet
export const getAllSourceCodesByGoingOnEachCinemaPage = async(): Promise<string[]> => {
    const cinefile = fs.readFileSync('./cinemas.json', 'utf8');
    const cines = JSON.parse(cinefile);
    const cineUrls = Object.keys(cines).map(cineId => `http://www.allocine.fr/${cines[cineId].url}`);
    return asyncAllLimit(getSourceCode, [cineUrls[3]], 10);
};
