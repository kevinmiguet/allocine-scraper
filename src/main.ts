import { scrap } from './scrape';
import { cleaner } from './clean-and-save';
import { enrich } from './enrich';
import * as puppeteer from 'puppeteer';
import { getAllSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';
import * as tmp from './utils/temp';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: true,
    timeout: 1000 * 60 * 5,
};

export type Key = string;

async function main(): Promise<void> {
    // get source code of pages (on the website)
    return getAllSourceCodes()
        // analyze and extract information from it (offline)
        .then(sourceCodesKeys => {
            console.log('Scraping');
            return Promise.all(sourceCodesKeys.map(sourceCodesKey => scrap(sourceCodesKey)));
        })
        // structure this information properly and save it
        .then(scrappedKeys => Promise.all(scrappedKeys.map(scrappedKey => cleaner(scrappedKey))))
        // get extra information and download images (on the website)
        .then(() => enrich())
        // format it for front (offline)
        .then(() => bakeForFront())

        // if it fails somewhere, try again
        .catch((error) => {
            console.log(error);
            main();
        });
}

// getAllSourceCodesByGoingOnEachCinemaPage()
//     // get source code of pages (on the website)
//     .then(sourceCodes => Promise.all(sourceCodes.map(sourceCode => scrapForMoviePage(sourceCode))));
tmp.clean();
main();
