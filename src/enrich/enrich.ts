
import { Movie } from '../types';
import { asyncAllLimitForBrowserFunction } from '../utils/asyncLimit';
import { logger } from '../utils/utils';
import { database, getMovie } from '../utils/database';
import { getAndSavePosters } from './get-posters';
import { chunkSizeForEnrich } from '../main';
import { getMoviesDetails } from './get-details';
// use http://www.allocine.fr/film/fichefilm_gen_cfilm=273905.html
// to get release date and nationality
export const enrich = async (): Promise<any> => {
    logger.info('enriching data');
    const movieIds = Object.keys(database.movies);
    const movies = movieIds.map(getMovie);

    const doesMovieNeedPoster = (movie: Movie) => movie.poster && movie.poster.indexOf('http://') > -1;
    await asyncAllLimitForBrowserFunction(getAndSavePosters, movies.filter(doesMovieNeedPoster), chunkSizeForEnrich);

    const doesMovieNeedExtraInfo = ((movie: Movie) => !movie.countries && !movie.summary && !movie.releaseDate);
    await getMoviesDetails(movies.filter(doesMovieNeedExtraInfo));

    return Promise.resolve();
};
