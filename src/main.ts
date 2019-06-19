import { scrap } from './scrape';
import { cleaner } from './clean-and-save';
import { enrich } from './enrich';
import * as puppeteer from 'puppeteer';
import { getAllSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';
import * as tmp from './utils/temp';
import { logger } from './utils/logger';
import { asyncAllLimit } from './utils/asyncLimit';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: false,
    timeout: 1000 * 60 * 5,
};
export const nbCinePageSourceToGet = 22;
export const chunkSizeForSourceGetter = 3;
export const chunkSizeForScrap = 2;
export const chunkSizeForEnrich = 3;

export type Key = string;

async function main(): Promise<void> {
    // get source code of pages (on the website)
    return getAllSourceCodes()
        // analyze and extract information from it (offline)
        .then(sourceCodesKeys => {
            logger.info('scraping...');
            async function scrapFn(keys: Key[]): Promise<any[]> {
                return Promise.all(keys.map(sourceCodesKey => scrap(sourceCodesKey)));
            }
            return asyncAllLimit(scrapFn, sourceCodesKeys, chunkSizeForScrap);
        })
        // structure this information properly and save it
        .then(scrappedKeys => Promise.all(scrappedKeys.map(scrappedKey => cleaner(scrappedKey))))
        // get extra information and download images (on the website)
        .then(() => enrich())
        // format it for front (offline)
        .then(() => bakeForFront())

        // if it fails somewhere, try again
        .catch((error) => {
            logger.error(error);
            main();
        });
}

tmp.clean();
main();
