import { database } from './utils/database';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { getOldMovies, getRetrospectives, getRecentMovies } from './utils/cluster';
import { Movie } from './clean-and-save';

const exportFolder = './export';

export const bakeForFront = () => {
    const seen = {};
    const moviesForFront: { [movieId: string]: Movie } = Object.keys(database.schedules)
        // only keep movies that are scheduled this week
        .map(scheduleId => database.schedules[scheduleId].movieId)
        .filter(movieId => seen.hasOwnProperty(movieId) ? false : (seen[movieId] = true))
        .reduce((_moviesForFront, movieId) => {
            _moviesForFront[movieId] = database.movies[movieId];
            return _moviesForFront;
        }, {});

    // clusters are movie Ids grouped by theme for front
    const clusters = {
        recent: getRecentMovies(moviesForFront),
        old: getOldMovies(moviesForFront),
        retro: getRetrospectives(moviesForFront),
    };
    // remove previous folder if necessary
    if (fs.existsSync(exportFolder)) {
        rimraf.sync(exportFolder);
    }
    fs.mkdirSync(exportFolder);
    fs.mkdirSync(`${exportFolder}/posters/`);
    // copy necessary posters
    Object.keys(moviesForFront).forEach(movieId => {
        const moviePoster = moviesForFront[movieId].poster;
        if (moviePoster != '' && !fs.existsSync(`${exportFolder}/posters/${moviePoster}`)) {
            if (!fs.existsSync(`./posters/${moviePoster}`)) {
                console.log(`./posters/${moviePoster} does not exist, this is weird!`);
                return;
            }
            fs.copyFileSync(`./posters/${moviePoster}`, `${exportFolder}/posters/${moviePoster}`);
        }
    });
    fs.writeFileSync(`${exportFolder}/movies.json`, JSON.stringify(moviesForFront, null, 4));
    fs.writeFileSync(`${exportFolder}/cinemas.json`, JSON.stringify(database.cinemas, null, 4));
    fs.writeFileSync(`${exportFolder}/schedules.json`, JSON.stringify(database.schedules, null, 4));
    fs.writeFileSync(`${exportFolder}/clusters.json`, JSON.stringify(clusters, null, 4));
};
