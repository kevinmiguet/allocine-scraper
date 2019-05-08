import { scrap } from './scrape';
import { cleaner } from './clean-and-save';
import { enrich } from './enrich';
import * as puppeteer from 'puppeteer';
import { getAllSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: false,
    timeout: 1000 * 60 * 5,
};

async function main(): Promise<void> {
    // get source code of pages (on the website)
    getAllSourceCodes()
        // analyze and extract information from it (offline)
        .then(sourceCodes => {
            return Promise.all(sourceCodes.map(sourceCode => scrap(sourceCode)));
        })
        // structure this information properly and save it
        .then(scraps => Promise.all(scraps.map(scrapped => cleaner(scrapped))))
        // get extra information and download images (on the website)
        .then(() => enrich())
        // format it for front (offline)
        .then(() => bakeForFront())

        // if it fails somewhere, try again
        .catch(() => main());
}

// getAllSourceCodesByGoingOnEachCinemaPage()
//     // get source code of pages (on the website)
//     .then(sourceCodes => Promise.all(sourceCodes.map(sourceCode => scrapForMoviePage(sourceCode))));

main();
