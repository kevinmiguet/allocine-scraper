import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { browserOptions, chunkSizeForEnrich } from './main';
import { getMovie, setMovie, writeDatabases, database } from './utils/database';
import { Movie } from './clean-and-save';
import { asyncAllLimit } from './utils/asyncLimit';
import { logger } from './utils/logger';


export const enrich = async (): Promise<any> => {
    logger.info('enriching data');
    const movieIds = Object.keys(database.movies);
    const doesMovieNeedPoster = ((movie: Movie) => movie.poster && movie.poster.indexOf('http://') > -1);
    const movies = movieIds
        .map(movieId => getMovie(movieId))
        .filter(movie => doesMovieNeedPoster(movie));
    return asyncAllLimit(getPosters, movies, chunkSizeForEnrich);
};

const getPosters = async (movies: Movie[]): Promise<void> => {
    const browser = await puppeteer.launch(browserOptions);
    return Promise.all(movies.map(async (movie) => {
        const url = movie.poster;
        const filename = `${movie.id}.jpg`;
        await getImageAndSaveIt(url, filename, browser)
            .then((foundImage) => {
                if (foundImage) {
                    setMovie({
                        ...movie,
                        poster: filename,
                    });
                } else {
                    delete movie.poster;
                    setMovie(movie);
                    console.log(`could not find ${movie.title} poster !`);
                }
            });
    }))
    // once all movies are done
    .then(() => {
        // close the browser
        browser.close();
        // force to write the databases
        writeDatabases();
        return Promise.resolve();
    });
};
const getImageAndSaveIt = async (url: string, filename: string, _browser: puppeteer.Browser, n: number = 0): Promise<boolean> => {
    const FILESTOSAVE = ['jpg', 'png', 'gif', 'jpeg'];
    const IMAGE_FOLDER = './posters';
    let newPosterPath: string = '';
    let foundImage = false;
    const _saveImageOnResponse = async (response: puppeteer.Response) => {
        const imagePath = response.url();
        const fileRegex = new RegExp(`.*\.(${FILESTOSAVE.join('|')})$`);
        const matches = fileRegex.exec(imagePath);
        if (matches && (matches.length === 2)) {
            const buffer = await response.buffer();
            newPosterPath = `${IMAGE_FOLDER}/${filename}`;
            if (!fs.existsSync(`${IMAGE_FOLDER}/`)) {
                fs.mkdirSync(`${IMAGE_FOLDER}`);
            }
            fs.writeFileSync(newPosterPath, buffer, 'base64');
            foundImage = true;
        }
    };

    const page = await _browser.newPage();
    await page.on('response', _saveImageOnResponse);
    await page.goto(url, { waitUntil: 'networkidle0' })
        .then(() => {
            if (foundImage) {
                return Promise.resolve(foundImage);
            }
            if (n === 3) {
                // we tried three times already, just stop
                // it's ok even if we found nothing
                return Promise.resolve(foundImage);
            }
            // otherwise, try again
            getImageAndSaveIt(url, filename, _browser, n + 1);
        })
        .catch(error => {
            logger.error(error);
        });
    return Promise.resolve(foundImage);
};


