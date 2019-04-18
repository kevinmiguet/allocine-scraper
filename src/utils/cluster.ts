import { MoviesById } from '../clean-and-save';

interface MovieCluster {
    // type: 'carousel' | 'classic';
    movieIds: string[];
    title: string;
}
export const getRecentMovies = (movies: MoviesById): MovieCluster[] => {
    const recentMovieIds = Object.keys(movies)
        .filter(movieId => movies[movieId].year && movies[movieId].year >= 2018);
    return [{
        movieIds: recentMovieIds,
        title: '',
    }];
};

export const getOldMovies = (movies: MoviesById): MovieCluster[] => {
    const oldMovieIds = Object.keys(movies)
        .filter(movieId => movies[movieId].year && movies[movieId].year < 2018);
    // for now we return one big cluster containing all old movies
    // @TODO: add a button to sort movies by release date on front
    return [{
        movieIds: oldMovieIds,
        title: 'old movies',
    }];
};

export const getRetrospectives = (movies: MoviesById): MovieCluster[] => {
    // group movies by directors
    const movieIdsByDirector: {[director: string]: string[]} = {};
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
