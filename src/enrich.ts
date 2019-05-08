import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { browserOptions } from './main';
import { getMovie, setMovie, writeDatabases, database } from './utils/database';
import { Movie } from './clean-and-save';
import { asyncAllLimit } from './utils/asyncLimit';


export const enrich = async (): Promise<any> => {
    console.log('enriching data');
    const movieIds = Object.keys(database.movies);
    const doesMovieNeedPoster = ((movie: Movie) => movie.poster && movie.poster.indexOf('http://') > -1);
    const movies = movieIds
        .map(movieId => getMovie(movieId))
        .filter(movie => doesMovieNeedPoster(movie));
    return asyncAllLimit(getPosters, movies, 5);
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
                    console.log(`did not find poster at ${url}`);
                }
            });
    }))

    .then(() => {
        // close the browser
        browser.close();
        // force to write the databases
        writeDatabases();
        return Promise.resolve();
    });
};
const getImageAndSaveIt = async (url: string, filename: string, _browser: puppeteer.Browser): Promise<boolean> => {
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
        .catch(error => {
            console.log(error);
        });
    return Promise.resolve(foundImage);
};


