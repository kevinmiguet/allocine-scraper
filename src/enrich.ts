import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { browserOptions } from './app';
import { getMovie, setMovie, writeDatabase } from './database';


const getImageAndSaveIt = async(path: string, filename: string, _browser: puppeteer.Browser): Promise<void> => {
    const FILESTOSAVE = ['jpg', 'png'];
    const IMAGE_FOLDER = '.';
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
    await page.goto(path, {waitUntil: 'networkidle0'})
        .catch(error => {
            console.log(error);
        });
    return Promise.resolve();
};

export const enrich = async(movieIds: string[]): Promise<void>  => {
    const moviesToEnrich = movieIds
    .map(movieId => getMovie(movieId))
    .filter(movie => movie.poster && movie.poster !== '');
    const browser = await puppeteer.launch(browserOptions);

    return Promise.all(moviesToEnrich.map(async(movie) => {
        const path = movie.poster;
        const filename = `./${movie.id}.jpg`;
        await getImageAndSaveIt(path, filename, browser)
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

