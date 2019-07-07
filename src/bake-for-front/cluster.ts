import { MoviesById, ScheduleById } from '../clean-and-save';
import { getIndexedScheduleIds } from '../utils/database';
import { getPreviousWednesday, isSameDay } from '../utils/utils';

interface MovieCluster {
    movieIds: string[];
    title: string;
}
const currentYear = new Date().getFullYear();
export const getRecentMovies = (movies: MoviesById, schedulesForFront: ScheduleById): MovieCluster[] => {
    const indexedScheduleIds = getIndexedScheduleIds(schedulesForFront);
    // put movies with more schedules last (so that they appear on top)
    const sortByNbOfSchedules = ((movieIdA: string, movieIdB: string) => indexedScheduleIds[movieIdB].length - indexedScheduleIds[movieIdA].length);
    const previousWednesday = getPreviousWednesday(new Date());
    const weeklyReleaseMovieIds = Object.keys(movies)
        .filter(movieId => isSameDay(movies[movieId].releaseDate, previousWednesday))
        .sort(sortByNbOfSchedules);

    const otherRecentMovieIds = Object.keys(movies)
        .filter(movieId => movies[movieId].releaseDate && new Date(movies[movieId].releaseDate).getFullYear() >= currentYear - 1
            && weeklyReleaseMovieIds.indexOf(movieId) === -1)
        .sort(sortByNbOfSchedules);

    return [
        {
            movieIds: weeklyReleaseMovieIds,
            title: 'Les sorties de la semaine',
        },
        {
            movieIds: otherRecentMovieIds,
            title: 'Autres films récents',
        }];
};

export const getOldMovies = (movies: MoviesById): MovieCluster[] => {
    const oldMovieIds = Object.keys(movies)
        .filter(movieId => movies[movieId].releaseDate && new Date(movies[movieId].releaseDate).getFullYear() < currentYear - 1);

    // for now we return one big cluster containing all old movies
    // @TODO: add a button to sort movies by release date on front
    return [{
        movieIds: oldMovieIds,
        title: 'Vieux films',
    }];
};

export const getRetrospectives = (movies: MoviesById): MovieCluster[] => {
    // group movies by directors
    const movieIdsByDirector: { [director: string]: string[] } = {};
    Object.keys(movies).forEach(movieId => {
        const director = movies[movieId].directors[0];
        if (director === '') {
            return;
        }
        if (!movieIdsByDirector[director]) {
            movieIdsByDirector[director] = [];
        } movieIdsByDirector[director].push(movieId);
    });
    return Object.keys(movieIdsByDirector)
        // remove those with only one movie
        .filter(director => movieIdsByDirector[director].length > 2)
        // return the right format
        .map(directorWithMoreThanTwoMovies => {
            return {
                title: directorWithMoreThanTwoMovies,
                movieIds: movieIdsByDirector[directorWithMoreThanTwoMovies],
            };
        })
        // and sort by number of movies
        .sort((a, b) => b.movieIds.length - a.movieIds.length);
};
// add get by country and get by genre
// use the clusters for search function in front
