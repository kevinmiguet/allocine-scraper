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
        title: '',
    }];
};

export const getRetrospectives = (movies: MoviesById): MovieCluster[] => {
    // group movies by directors
    const movieIdsByDirector: {[director: string]: string[]} = {};
    Object.keys(movies).forEach(movieId => {
        // @TODO: handle several directors
        const director = movies[movieId].directors[0];
        if (director === '') {
            return;
        }
        if (!movieIdsByDirector[director]) {
            movieIdsByDirector[director] = [];
        } movieIdsByDirector[director].push(movieId);
    });
    // remove the one with only one movie
    // return the right format
    // and sort by number of movies
    return Object.keys(movieIdsByDirector)
        .filter(director => movieIdsByDirector[director].length > 2)
        .map(directorWithMoreThanTwoMovies => {
            return {
                title: directorWithMoreThanTwoMovies,
                movieIds: movieIdsByDirector[directorWithMoreThanTwoMovies],
            };
        })
        .sort((a, b) => b.movieIds.length - a.movieIds.length);
};