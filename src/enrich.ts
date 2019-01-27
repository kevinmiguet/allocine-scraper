import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { browserOptions } from './main';
import { getMovie, setMovie, writeDatabase } from './utils/database';

// @TODO: retrieve release date in france and nationality
const getImageAndSaveIt = async(url: string, filename: string, _browser: puppeteer.Browser): Promise<void> => {
    const FILESTOSAVE = ['jpg', 'png'];
    const IMAGE_FOLDER = './posters';
    let newPosterPath: string = '';
    const _saveImageOnResponse = async (response: puppeteer.Response) => {
        const imagePath = response.url();
        const fileRegex = new RegExp(`.*\.(${FILESTOSAVE.join('|')})$`);
        const matches = fileRegex.exec(imagePath);
        if (matches && (matches.length === 2)) {
          const buffer = await response.buffer();
          newPosterPath = `${IMAGE_FOLDER}/${filename}`;
          fs.writeFileSync(newPosterPath, buffer, 'base64');
        }
    };

    const page = await _browser.newPage();
    await page.on('response', _saveImageOnResponse);
    await page.goto(url, {waitUntil: 'networkidle0'})
        .catch(error => {
            console.log(error);
        });
    return Promise.resolve();
};
// @TODO: get any missing information here
export const enrich = async(movieIds: string[]): Promise<void>  => {
    const moviesToEnrich = movieIds
    .map(movieId => getMovie(movieId))
    .filter(movie => movie.poster && movie.poster !== '');
    const browser = await puppeteer.launch(browserOptions);

    return Promise.all(moviesToEnrich.map(async(movie) => {
        const url = movie.poster;
        const filename = `${movie.id}.jpg`;
        await getImageAndSaveIt(url, filename, browser)
        .then(() => {
            setMovie({
                ...movie,
                poster: filename,
            });
        });
    }))
    .then(() => {
        // close the browser
        browser.close();
        // force to write the databases
        writeDatabase();
        return Promise.resolve();
    });

};

