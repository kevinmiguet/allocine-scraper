import { scrap } from './scrape';
import { cleaner, dataToBeEnriched } from './clean-and-save';
import { enrich } from './enrich';
import * as puppeteer from 'puppeteer';
import { getAllSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: true,
    // timeout: 0,
};

getAllSourceCodes()
    .then(sourceCodes => Promise.all(sourceCodes.map(sourceCode => scrap(sourceCode))))
    .then(scraps => Promise.all(scraps.map(scrapped => cleaner(scrapped))))
    .then(() => enrich())
    .then(() => bakeForFront());
