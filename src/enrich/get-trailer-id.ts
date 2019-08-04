import { Movie } from '../types';
import { asyncAllLimit } from '../utils/asyncLimit';
import { searchYoutube } from '../utils/youtubeUtils';
import { setMovie, writeDatabases } from '../utils/database';
import { normalizeText, removeDiacritics, logger } from '../utils/utils';


export const getAndSaveTrailerIds = async (movies: Movie[]) => {
    return await asyncAllLimit(getAndSaveTrailerId, movies, 3)
    .catch((err) => {
        // if there is a quota issue,
        // we just want to stop fetching the api
        // and finish the process gracefully.
        // Trying again won't help
        return Promise.resolve();
    });
};

async function getAndSaveTrailerId(movie: Movie): Promise<void> {
    const request = `${movie.title} ${movie.directors[0]} bande annonce trailer`;
    let items;
    try {
        const ytresult = await searchYoutube(request);
        items = ytresult.items;
    } catch (err) {
        Promise.reject();
    }

    const trailerCandidates = items.map(item => ({
        id: item.id.videoId,
        title: normalizeTrailerField(item.snippet.title),
        description: normalizeTrailerField(item.snippet.description),
    }));

    const choosenTrailer = trailerCandidates.find(el =>
        el.title.includes('annonce') || el.title.includes('trailer')
        || el.description.includes('annonce') || el.description.includes('annonce'),
    );
    if (!choosenTrailer) {
        logger.info(`no trailer found for ${movie.title}`);
        return;
    }
        setMovie({id: movie.id, trailerId: choosenTrailer.id});
        writeDatabases();
}

const normalizeTrailerField = (str: string) => removeDiacritics(normalizeText(str.toLowerCase()));
