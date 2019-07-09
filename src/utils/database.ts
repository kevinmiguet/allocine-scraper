import * as fs from 'fs';
import { Database, Cinema, Movie, Schedule, ScheduleById } from '../types';

export const paths = {
    // based on where the script is launched
    movieDb: './movies.json',
    cinemasDb: './cinemas.json',
};

export let database: Database = {
    cinemas: {},
    movies: {},
    schedules: {},
};
if (fs.existsSync(paths.movieDb)) {
    database.movies = JSON.parse(fs.readFileSync(paths.movieDb, 'utf8'));
}
if (fs.existsSync(paths.cinemasDb)) {
    database.cinemas = JSON.parse(fs.readFileSync(paths.cinemasDb, 'utf8'));
}
export const getMovie = (movieId: string): Movie => database.movies[movieId];
export const getCine = (cineId: string): Cinema => database.cinemas[cineId];
export const setMovie = (movie: Partial<Movie>): Movie => {
    if (!movie.id) {
        throw new Error('should provide an id when using setMovie !');
    }
    if (!database.movies[movie.id])  {
        database.movies[movie.id] = movie as Movie;
    } else {
        database.movies[movie.id] = {
            ...database.movies[movie.id],
            ...movie,
        };
    }
    return getMovie(movie.id);
};
export const setMoviePoster = (movieId: string, poster: string) => {
    if (!database.movies[movieId]) {
        throw new Error('trying to set movie poster of non existing movie ..');
    }
    database.movies[movieId].poster = poster;
};
export const setCine = (cinema: Cinema): Cinema => {
    database.cinemas[cinema.id] = cinema;
    return getCine(cinema.id);
};

interface IndexedScheduleIds  {
    [id: string]: string[];
}

export const getIndexedScheduleIds = (schedules: ScheduleById): IndexedScheduleIds => {
    return Object.keys(schedules)
    .reduce((_indexedScheduleIds, scheduleId) => {
        const schedule = schedules[scheduleId];
        if (!_indexedScheduleIds[schedule.cineId]) {
            _indexedScheduleIds[schedule.cineId] = [];
        }
        if (!_indexedScheduleIds[schedule.movieId]) {
            _indexedScheduleIds[schedule.movieId] = [];
        }
        _indexedScheduleIds[schedule.cineId].push(scheduleId);
        _indexedScheduleIds[schedule.movieId].push(scheduleId);
        return _indexedScheduleIds;
    }, {});
};

const indexedScheduleIds = getIndexedScheduleIds(database.schedules);

type getSchedulesArgs = {
    movieId?: string;
    cineId?: string;
};
export const getScheduleId = (schedule: Schedule): string => {
    return `${schedule.movieId}-${schedule.cineId}`;
};
export const setSchedule = (schedule: Schedule): Schedule => {
    const scheduleId = getScheduleId(schedule);
    database.schedules[scheduleId] = schedule;
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

export const writeDatabases = (): void => {
    fs.writeFileSync('./schedules.json', JSON.stringify(database.schedules, null, 4));
    fs.writeFileSync('./movies.json', JSON.stringify(database.movies, null, 4));
    fs.writeFileSync('./cinemas.json', JSON.stringify(database.cinemas, null, 4));
};
