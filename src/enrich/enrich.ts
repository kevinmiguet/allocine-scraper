
import { Movie, Cinema } from '../types';
import { asyncAllLimitForBrowserFunction } from '../utils/asyncLimit';
import { logger } from '../utils/utils';
import { database, getMovie, getCine, writeDatabases } from '../utils/database';
import { getAndSavePosters } from './get-posters';
import { chunkSizeForEnrich } from '../main';
import { getMoviesDetails } from './get-details';
import { getAndSaveTrailerIds } from './get-trailer-id';
import { setCinePositionsAsync} from  './get-position';
// use http://www.allocine.fr/film/fichefilm_gen_cfilm=273905.html
// to get release date and nationality
// and add position to cinemas
export const enrich = async (): Promise<any> => {
    logger.title('enrich');

    const cinemaIds = Object.keys(database.cinemas);
    const cinemas = cinemaIds.map(getCine);
    const doesCineNeedPosition = (cine: Cinema) => !cine.pos;
    await setCinePositionsAsync(cinemas.filter(doesCineNeedPosition));

    const movieIds = Object.keys(database.movies);
    const movies = movieIds.map(getMovie);

    const doesMovieNeedPoster = (movie: Movie) => movie.poster && movie.poster.indexOf('http://') > -1;
    await asyncAllLimitForBrowserFunction(getAndSavePosters, movies.filter(doesMovieNeedPoster), chunkSizeForEnrich);

    const doesMovieNeedExtraInfo = ((movie: Movie) => !movie.countries && !movie.summary && !movie.releaseDate);
    await getMoviesDetails(movies.filter(doesMovieNeedExtraInfo));

    const doesMovieNeedTrailerId = ((movie: Movie) => !movie.trailerId);
    await getAndSaveTrailerIds(movies.filter(doesMovieNeedTrailerId));

    writeDatabases();
    return Promise.resolve();
};
