import { getMovie, getCine, setCine, setMovie, getSchedule, writeDatabase, setSchedule } from './database';

/// IN
export type allocineScrap = {
    cinemaData: acCinema;
    days: acDay[]
    schedule: acSchedule[];
};
export type acDay = {
    day: string;
    weekday: string;
};
export type acCinema = {
    name: string;
    id: string;
    address: string;
};
export type acMovieTime = {
    debut: string;
    fin: string;
};
export type acSchedule = {
    dayId: string;
    movieDatas: acMovieData[]
    movieTimes: acMovieTime[][]
};
export type acMovieData = {
    movie: acMovie;
    version: string;
    quality: string;
};
export type acMovie = {
    id: string;
    title: string;
    year: string;
    page: string;
    trailer: string;
    poster: string;
    directors: string[],
    actors: string[],
    genre: string[],
    distributor: string
};

/// OUT
export interface Movie {
    id: string;
    title: string;
    year: number;
    actors: string[];
    directors: string[];
    genres: string[];
    poster: string;
}

export interface Week {
    lundi: string[];
    mardi: string[];
    mercredi: string[];
    jeudi: string[];
    vendredi: string[];
    samedi: string[];
    dimanche: string[];
}

export interface Cinema {
    id: string;
    name: string;
    address: string;
    pos: {
        lat: number;
        lng: number;
    };
}

export interface Schedule {
    movieId: string;
    cineId: string;
    schedule: Week;
}
export interface Database {
    schedules: {[scheduleId: string]: Schedule};
    movies: {[movieId: string]: Movie};
    cinemas: {[cinemaId: string]: Cinema};
}

export let dataToBeEnriched: CleanerOutput = {
    cineIds: [],
    movieIds: [],
};
function cleanAndSaveMovieData (scrapedDataFromOnePage: allocineScrap): void {
    scrapedDataFromOnePage.schedule
    .forEach(_scheduleData => _scheduleData.movieDatas.forEach(movieData => {
        const movieToBeSaved = movieData.movie;
        // don't save it if it was already done
        const movieShouldBeSaved = movieToBeSaved.id && !getMovie(movieToBeSaved.id);
        if (movieShouldBeSaved) {
            setMovie({
                id: movieToBeSaved.id,
                title: movieToBeSaved.title,
                directors: movieToBeSaved.directors,
                year: parseInt(movieData.movie.year, 10),
                actors: movieToBeSaved.actors,
                genres: movieToBeSaved.genre,
                poster: movieToBeSaved.poster,
            });
            // since we just saved this movie, it needs to be added to the output
            // so that the 'ENRICH' step treat it (download its poster, etc...)
            dataToBeEnriched.movieIds.push(movieToBeSaved.id);
        }
    }));
}

function cleanAndSaveCineData (scrapedDataFromOnePage: allocineScrap): void {
    const cineData = scrapedDataFromOnePage.cinemaData;
    // @TODO: make a CRC32 hash of the allocine id
    const cineShouldBeSaved = !getCine(cineData.id);
    if (cineShouldBeSaved) {
        setCine({
            ...cineData,
            pos: null,
        });
    }
}

function cleanAndSaveScheduleData(scrapedDataFromOnePage: allocineScrap): void {
    // map of day id and their human name
    const dayIdToDayName = scrapedDataFromOnePage.days.reduce((_dayIdToDayName, day, dayId) => {
        _dayIdToDayName[dayId] = day.weekday;
        return _dayIdToDayName;
    }, {});

    // iterate through each day scrapedData
    scrapedDataFromOnePage.schedule.forEach(scheduleOfOneDay => {
        if (scheduleOfOneDay.movieTimes.length !== scheduleOfOneDay.movieDatas.length) {
            throw new Error('movieTimes and movieDatas don\'t have the same length');
        }
        // we only need the id of movies at this step
        const movieIds = scheduleOfOneDay.movieDatas.map(m => m.movie.id);
        // setting schedule here
        movieIds.forEach((movieId, i) => {
            const cineId = scrapedDataFromOnePage.cinemaData.id;
            let scheduleToModify = getSchedule(movieId, cineId);
            // it's the first time we encounter this movie/cine combination
            // we should build a schedule from scratch
            if (!scheduleToModify) {
                scheduleToModify = setSchedule({
                    cineId,
                    movieId,
                    schedule: {},
                } as Schedule);
            }
            // monday, tuesday ....
            const dayName = dayIdToDayName[scheduleOfOneDay.dayId];
            const thisMovieScheduleForThisDay = scheduleOfOneDay.movieTimes[i];
            scheduleToModify.schedule = {
                ...scheduleToModify.schedule,
                [dayName]: thisMovieScheduleForThisDay.map(schedule => schedule.debut),
            };
        });
    });
}
export interface CleanerOutput {
    movieIds: string[];
    cineIds: string[];
}
export function cleaner(scrapedData: allocineScrap[]): Promise<void> {
    scrapedData.forEach(scrapedDataFromOnePage => {
        // add data to movies database
        cleanAndSaveMovieData(scrapedDataFromOnePage);
        // add data to cinema database
        cleanAndSaveCineData(scrapedDataFromOnePage);
        // add data to schedule database
        cleanAndSaveScheduleData(scrapedDataFromOnePage);
        // force to write database to files
        writeDatabase();
    });
    // @TODO return a list of movies and cine ids to enrich
    return Promise.resolve();
}
