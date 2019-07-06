import { Movie } from '../clean-and-save';
import { getMovieDetailsPageSourceCodes } from '../get-source-code';
import { Key, chunkSizeForScrap } from '../main';
import { asyncAllLimit } from '../utils/asyncLimit';
import * as tmp from '../utils/temp';
import { setMovie, writeDatabases } from '../utils/database';
import * as cheerio from 'cheerio';
import { normalizeText } from '../utils/utils';


export const getMoviesExtraInfo = async (movies: Movie[]) => {
    const movieIds = movies.map(m => m.id);
    return getMovieDetailsPageSourceCodes(movieIds)
    .then(keys => asyncAllLimit(scrapeMovieDetailPages, keys, chunkSizeForScrap))
    .then(keys => Promise.all(keys.map(cleanAndSaveMovieDetails)))
    .then(() => writeDatabases());
};

const scrapeMovieDetailPages = async (key: string): Promise<any> => {
    const html = await tmp.get(key);
    const $ = cheerio.load(html);
    return tmp.saveAndGetKey({
        id: $('#content-layout').data('seance-geoloc-redir'),
        releaseDate: $('.date.blue-link').text(),
        countries: $('.blue-link.nationality').text(),
        summary: $('.content-txt').text(),
    });
};

const cleanAndSaveMovieDetails = async (key: string): Promise<void> => {
    const movieInfo = await tmp.get(key);
    setMovie({
        id: movieInfo.id,
        releaseDate: movieInfo.releaseDate,
        countries: movieInfo.countries && normalizeText(movieInfo.countries).split(' '),
        summary: movieInfo.summary && normalizeText(movieInfo.summary),
    });
    return Promise.resolve();
};
