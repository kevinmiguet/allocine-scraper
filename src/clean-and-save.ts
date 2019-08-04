import { getMovie, setCine, setMovie, getSchedule, setSchedule, writeDatabases, setMoviePoster } from './utils/database';
import { Key } from './main';
import { get } from './utils/temp';
import { allocineScrap, Cinema, Schedule } from './types';
import { fetchCinePos, cleanAddress, extractZipcode } from './utils/positionHelper';
import { logger } from './utils/utils';

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
            });
            if (movieToBeSaved.poster && movieToBeSaved.poster !== '') {
                setMoviePoster(movieToBeSaved.id, movieToBeSaved.poster);
            }
        }
    }));
}

async function cleanAndSaveCineData (scrapedDataFromOnePage: allocineScrap): Promise<void> {
    const cineData = scrapedDataFromOnePage.cinemaData;

    let cine = {
        ...cineData,
        address: cleanAddress(cineData.address),
        zipCode: extractZipcode(cineData.address),
    } as Cinema;

    setCine(cine);
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
        const movieDatas = scheduleOfOneDay.movieDatas;
        // setting schedule here
        movieDatas.forEach((movieData, i) => {
            const movieId = movieData.movie.id;
            const cineId = scrapedDataFromOnePage.cinemaData.id;
            let scheduleToModify = getSchedule(movieId, cineId);
            // it's the first time we encounter this movie/cine combination
            // we should build a schedule from scratch
            if (!scheduleToModify) {
                scheduleToModify = setSchedule({
                    cineId,
                    movieId,
                    week: {},
                } as Schedule);
            }
            // monday, tuesday ....
            const dayName = dayIdToDayName[scheduleOfOneDay.dayId];
            const thisMovieScheduleForThisDay = scheduleOfOneDay.movieTimes[i];
            const normalizedScheduleForThisDay = thisMovieScheduleForThisDay.map(schedule => schedule.debut);
            scheduleToModify.week = {
                ...scheduleToModify.week,
                // we may have already saved something for this day,
                // ie if the same movie in another version
                [dayName]: {
                    ...scheduleToModify.week[dayName],
                    [movieData.version]: normalizedScheduleForThisDay,
                },
            };
        });
    });
}
export interface CleanerOutput {
    movieIds: string[];
    cineIds: string[];
}
export async function cleaner(scrapedDataKey: Key): Promise<void> {
    const scrapedData: any[] = await get(scrapedDataKey);
    scrapedData.forEach(async (scrapedDataFromOnePage: allocineScrap) => {
        // add data to movies database
        cleanAndSaveMovieData(scrapedDataFromOnePage);
        // add data to cinema database
        await cleanAndSaveCineData(scrapedDataFromOnePage);
        // add data to schedule database
        cleanAndSaveScheduleData(scrapedDataFromOnePage);
        // force to write database to files
        writeDatabases();
    });
    return Promise.resolve();
}
