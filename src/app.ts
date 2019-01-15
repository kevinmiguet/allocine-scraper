import * as puppeteer from 'puppeteer';
import { scrap } from './scrape';
import { cleaner, dataToBeEnriched } from './clean-and-save';
import { enrich } from './enrich';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: false,
    // timeout: 0,
};
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
const getAllSourceCodes = async(): Promise<string[]> => {
    const browser = await puppeteer.launch(browserOptions);

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

getAllSourceCodes()
.then(sourceCodes => Promise.all(sourceCodes.map(sourceCode => scrap(sourceCode))))
.then(scraps => Promise.all(scraps.map(scrapped => cleaner(scrapped))))
.then(() => {
    enrich(dataToBeEnriched.movieIds);
});

const chunkArray = (array: any[], groupSize: number): any[][] => {
    let sets = [];
    let i = 0;
    let chunks = array.length / groupSize;

    while (i < chunks) {
        sets[i] = array.splice(0, groupSize);
        i++;
    }

    return sets;
};

