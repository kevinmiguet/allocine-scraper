import * as puppeteer from 'puppeteer';
import { browserOptions, Key, nbCinePageSourceToGet, chunkSizeForSourceGetter } from './main';
import { asyncAllLimitForBrowserFunction } from './utils/asyncLimit';
import * as fs from 'fs';
import * as tmp from './utils/temp';
import { logger } from './utils/utils';

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

const getSourceCodeOnOnePage = async(url: string, browser: puppeteer.Browser, waitForSelector: string): Promise<Key> => {
    // try to get result from ram first
    const tempResult = await tmp.get(url, true);
    if (tempResult) {
        return tempResult;
    }
    let page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', abortUselessRequests);
    await page.goto(url);
    await page.waitForSelector(waitForSelector);

    // issue handling
    if (await isAdvertisePage(page)) {
        await page.click(advertiseSelector);
    }
    // get source and save it in tmp
    const source = await page.content();
    return tmp.saveAndGetKey(source, url);
};

const getSourceCode = async(urls: string[], waitForSelector: string): Promise<Key[]> => {
    const browser = await puppeteer.launch(browserOptions);
    return Promise.all(urls
    // save the sources on all pages in parallel
    // and return their Keys
    .map(url => getSourceCodeOnOnePage(url, browser, waitForSelector)))

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

export const getAllSchedulePageSourceCodes = async(): Promise<Key[]> => {
    logger.info('starting to get Schedule pages source code');
    const urls =  [...Array(nbCinePageSourceToGet).keys()].map(nb => `http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=${nb}`);
    const _getSourceCode = (_urls: string[]) => getSourceCode(_urls, '.theaterblock.j_entity_container');
    return asyncAllLimitForBrowserFunction(_getSourceCode, urls, chunkSizeForSourceGetter);
};

export const getMovieDetailsPageSourceCodes = async(movieIds: string[]): Promise<Key[]> => {
    logger.info('starting to get Movie Details pages source code');
    const urls = movieIds.map(movieId => `http://www.allocine.fr/film/fichefilm_gen_cfilm=${movieId}.html`);
    const _getSourceCode = (_urls: string[]) => getSourceCode(_urls, '#content-layout');
    return asyncAllLimitForBrowserFunction(_getSourceCode, urls, chunkSizeForSourceGetter);
};
