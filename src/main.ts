import { scrap } from './scrape';
import { cleaner } from './clean-and-save';
import { enrich } from './enrich/enrich';
import * as puppeteer from 'puppeteer';
import { getAllSchedulePageSourceCodes } from './get-source-code';
import { bakeForFront } from './bake-for-front';
import * as tmp from './utils/temp';
import { logger } from './utils/utils';
import { asyncAllLimit } from './utils/asyncLimit';

export const browserOptions: puppeteer.LaunchOptions = {
    headless: true,
    timeout: 1000 * 60 * 5,
};
export const nbCinePageSourceToGet = 22;
export const chunkSizeForSourceGetter = 3;
export const chunkSizeForScrap = 3;
export const chunkSizeForEnrich = 3;

export type Key = string;

async function main(): Promise<void> {
    // get source code of pages (on the website)
    return getAllSchedulePageSourceCodes()
        // analyze and extract information from it (offline)
        .then(sourceCodesKeys => asyncAllLimit(scrap, sourceCodesKeys, chunkSizeForScrap))
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
