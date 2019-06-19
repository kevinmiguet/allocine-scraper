import { database, getScheduleId } from './utils/database';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { getOldMovies, getRetrospectives, getRecentMovies } from './utils/cluster';
import { Movie, Cinema, Schedule } from './clean-and-save';
import * as sharp from 'sharp';
import { logger } from './utils/logger';

const exportFolder = './export';
interface Movies { [id: string]: Movie; }
interface Schedules { [id: string]: Schedule; }
interface Cinemas { [id: string]: Cinema; }
export const bakeForFront = () => {
    logger.info('baking front package');
    const cinemasForFront = getParisianCinemas();
    const schedulesForFront = getSchedulesForFront(cinemasForFront);
    const moviesForFront = getMoviesForFront(schedulesForFront);
    // clusters are movie Ids grouped by theme for front
    let clusters = {
        recent: getRecentMovies(moviesForFront, schedulesForFront),
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
    fs.writeFileSync(`${exportFolder}/cinemas.json`, JSON.stringify(cinemasForFront, null, 4));
    fs.writeFileSync(`${exportFolder}/schedules.json`, JSON.stringify(schedulesForFront, null, 4));
    fs.writeFileSync(`${exportFolder}/clusters.json`, JSON.stringify(clusters, null, 4));
};

const getParisianCinemas = (): Cinemas => {
    return Object.keys(database.cinemas)
        .filter(key => database.cinemas[key].address.indexOf('750') > -1)
        .reduce((parisianCinemas, cinemaId) => {
            // only keep necessary stuff here
            const {address, id, name, pos} = database.cinemas[cinemaId];
            parisianCinemas[cinemaId] = {address, id, pos, name} as Cinema;
            return parisianCinemas;
        }, {});
};
const getSchedulesForFront = (cinemasForFront: Cinemas): Schedules => {
    const cinemaToKeepIds = Object.keys(cinemasForFront);
    return Object.keys(database.schedules)
        .map(scId => database.schedules[scId])
        // only keep the schedule if it is in a cinema for front
        .filter(sc => cinemaToKeepIds.includes(sc.cineId))
        .reduce((schedulesForFront, schedule) => {
            schedulesForFront[getScheduleId(schedule)] = schedule;
            return schedulesForFront;
        }, {});
};
const getMoviesForFront = (schedulesForFront: Schedules): Movies => {
    const seen = {};
    return Object.keys(schedulesForFront)
        // only keep movies that are scheduled this week
        .map(scheduleId => schedulesForFront[scheduleId].movieId)
        .filter(movieId => seen.hasOwnProperty(movieId) ? false : (seen[movieId] = true))
        .reduce((_moviesForFront, movieId) => {
            _moviesForFront[movieId] = database.movies[movieId];
            return _moviesForFront;
        }, {});
};
function bakeImagesForFront(mvs: Movies): void {
    fs.mkdirSync(`${exportFolder}/posters/`);
    Object.keys(mvs).forEach(movieId => {
        const moviePoster = mvs[movieId].poster;
        if (moviePoster === '' || fs.existsSync(`${exportFolder}/posters/${moviePoster}`)) {
            return;
        }
        if (!fs.existsSync(`./posters/${moviePoster}`)) {
            logger.error(`./posters/${moviePoster} does not exist, this is weird!`);
            return;
        }
        sharp(`./posters/${moviePoster}`)
            .resize(300)
            .jpeg({ progressive: true, quality: 50 })
            .toFile(`${exportFolder}/posters/${moviePoster}`);
    });
}
