import { scrap } from './scrape';
import { cleaner } from './clean-and-save';
import { enrich } from './enrich';
import * as puppeteer from 'puppeteer';
import { getAllSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: true,
    timeout: 1000 * 60 * 3,
};

getAllSourceCodes()
    // get source code of pages (on the website)
    .then(sourceCodes => Promise.all(sourceCodes.map(sourceCode => scrap(sourceCode))))
    // analyze and extract information from it (offline)
    .then(scraps => Promise.all(scraps.map(scrapped => cleaner(scrapped))))
    // get extra information and download images (on the website)
    .then(() => enrich())
    // format it for front (offline)
    .then(() => bakeForFront());
