import * as fs from 'fs';
import { Database, Cinema, Movie, Schedule } from './clean-and-save';
// @TODO: try to find a database.json file to populate the variable,
// otherwise create an empty one
export let database: Database = {
    cinemas: {},
    movies: {},
    schedules: {},
};
if (fs.existsSync('./database.json')) {
    const {cinemas, movies}: Database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
    database.cinemas = cinemas;
    database.movies = movies;
}
export const getMovie = (movieId: string): Movie => database.movies[movieId];
export const getCine = (cineId: string): Cinema => database.cinemas[cineId];
export const setMovie = (movie: Movie): Movie => {
    database.movies[movie.id] = movie;
    return getMovie(movie.id);
};
export const setCine = (cinema: Cinema): Cinema => {
    database.cinemas[cinema.id] = cinema;
    return getCine(cinema.id);
};

interface IndexedScheduleIds  {
    [id: string]: string[];
}
const scheduleIds = Object.keys(database.schedules);
const indexedScheduleIds: IndexedScheduleIds = scheduleIds.reduce((_indexedScheduleIds, scheduleId) => {
    const schedule = database.schedules[scheduleId];
    if (!_indexedScheduleIds[schedule.cineId]) {
        _indexedScheduleIds[schedule.cineId] = [];
    }
    if (_indexedScheduleIds[schedule.movieId]) {
        _indexedScheduleIds[schedule.movieId] = [];
    }
    _indexedScheduleIds[schedule.cineId].push(scheduleId);
    _indexedScheduleIds[schedule.movieId].push(scheduleId);
    return _indexedScheduleIds;
}, {});

type getSchedulesArgs = {
    movieId?: string;
    cineId?: string;
};
export const setSchedule = (schedule: Schedule): Schedule => {
    database.schedules[`${schedule.movieId}-${schedule.cineId}`] = schedule;
    return getSchedule(schedule.movieId, schedule.cineId);
};
export const getSchedule = (movieId: string, cineId: string): Schedule => {
    return database.schedules[`${movieId}-${cineId}`];
};
export const getSchedules = (args: getSchedulesArgs): Schedule[] => {
    const {cineId, movieId} = args;
    // only return one
    if (!cineId && movieId) {
        return indexedScheduleIds[movieId].map(scheduleId => database.schedules[scheduleId]);
    } else if (!movieId && cineId) {
        return indexedScheduleIds[cineId].map(scheduleId => database.schedules[scheduleId]);
    } else {
        throw new Error('getSchedules: you should provide one argument !');
    }
};

export const writeDatabase = (): void => {
    fs.writeFileSync('./schedules.json', JSON.stringify(database.schedules, null, 4));
    fs.writeFileSync('./database.json', JSON.stringify({
        movies: database.movies,
        cinemas: database.cinemas,
    }, null, 4));
};
