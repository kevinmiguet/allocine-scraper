import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

import { browserOptions } from '../main';
import { writeDatabases, setMoviePoster, removeMoviePoster } from '../utils/database';
import { Movie } from '../types';

export const getAndSavePosters = async (movies: Movie[]): Promise<void> => {
    const browser = await puppeteer.launch(browserOptions);
    return Promise.all(movies
        .map(movie => getAndSavePoster(movie, browser)))
        // once all movies are done
        .then(() => {
            // close the browser
            browser.close();
            // force to write the databases
            writeDatabases();
            return Promise.resolve();
        });
};

const getAndSavePoster = async (movie: Movie, browser: puppeteer.Browser): Promise<void> => {
    const url = movie.poster;
    const IMAGE_FOLDER = './posters';
    const filename = `${movie.id}.jpg`;

    return getImage(url, browser)
        .then(imageBuffer => {
            if (!fs.existsSync(`${IMAGE_FOLDER}/`)) {
                fs.mkdirSync(`${IMAGE_FOLDER}`);
            }
            fs.writeFileSync(`${IMAGE_FOLDER}/${filename}`, imageBuffer, 'base64');
            setMoviePoster(movie.id, filename);
        })

        .catch(() => {
            removeMoviePoster(movie.id);
            console.log(`could not find ${movie.title} poster !`);
        });
};

const getImage = async (url: string, _browser: puppeteer.Browser): Promise<Buffer> => {
    const FILESTOSAVE = ['jpg', 'png', 'gif', 'jpeg'];

    const page = await _browser.newPage();
    let resolve: Function = null;
    const imagePromise: Promise<Buffer> = new Promise(r => resolve = r);

    await page.on('response', async (response: puppeteer.Response): Promise<Buffer> => {
        const imagePath = response.url();
        const fileRegex = new RegExp(`.*\.(${FILESTOSAVE.join('|')})$`);
        const matches = fileRegex.exec(imagePath);
        const responseIsAnImage = matches && (matches.length === 2);
        if (responseIsAnImage) {
            const _buffer = await response.buffer();
            return resolve(_buffer);
        }
    });
    await page.goto(url, { waitUntil: 'networkidle0' });
    // if we did not receive anything after 10 seconds
    // reject the promise
    const timeout = setTimeout(() => Promise.reject(), 10 * 1000);

    const buffer = await imagePromise;
    clearTimeout(timeout);
    return Promise.resolve(buffer);
};
