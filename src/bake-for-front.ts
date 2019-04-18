import { database } from './utils/database';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { getOldMovies, getRetrospectives, getRecentMovies } from './utils/cluster';
import { Movie } from './clean-and-save';
import * as sharp from 'sharp';

const exportFolder = './export';
interface MoviesForFront { [movieId: string]: Movie; }
export const bakeForFront = () => {
    const seen = {};
    const moviesForFront: MoviesForFront = Object.keys(database.schedules)
        // only keep movies that are scheduled this week
        .map(scheduleId => database.schedules[scheduleId].movieId)
        .filter(movieId => seen.hasOwnProperty(movieId) ? false : (seen[movieId] = true))
        .reduce((_moviesForFront, movieId) => {
            _moviesForFront[movieId] = database.movies[movieId];
            return _moviesForFront;
        }, {});

    // clusters are movie Ids grouped by theme for front
    let clusters = {
        recent: getRecentMovies(moviesForFront),
        old: getOldMovies(moviesForFront),
        retro: getRetrospectives(moviesForFront),
        all: null as any,
    };
    // @TODO: un-dirtify this thing
    clusters.all = [...clusters.recent, ...clusters.old, ...clusters.retro];
    // remove previous folder if necessary
    if (fs.existsSync(exportFolder)) {
        rimraf.sync(exportFolder);
    }
    fs.mkdirSync(exportFolder);
    // copy necessary posters
    bakeImagesForFront(moviesForFront);
    fs.writeFileSync(`${exportFolder}/movies.json`, JSON.stringify(moviesForFront, null, 4));
    fs.writeFileSync(`${exportFolder}/cinemas.json`, JSON.stringify(database.cinemas, null, 4));
    fs.writeFileSync(`${exportFolder}/schedules.json`, JSON.stringify(database.schedules, null, 4));
    fs.writeFileSync(`${exportFolder}/clusters.json`, JSON.stringify(clusters, null, 4));
};

function bakeImagesForFront(mvs: MoviesForFront): void {
    fs.mkdirSync(`${exportFolder}/posters/`);
    Object.keys(mvs).forEach(movieId => {
        const moviePoster = mvs[movieId].poster;
        if (moviePoster === '' || fs.existsSync(`${exportFolder}/posters/${moviePoster}`)) {
            return;
        }
        if (!fs.existsSync(`./posters/${moviePoster}`)) {
            console.log(`./posters/${moviePoster} does not exist, this is weird!`);
            return;
        }
        sharp(`./posters/${moviePoster}`)
            .resize(300)
            .jpeg({progressive: true, quality: 50})
            .toFile(`${exportFolder}/posters/${moviePoster}`);
    });
}
