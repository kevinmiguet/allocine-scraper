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
    url: string;
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
export type acPosition = {
    cineId: string,
    name: string,
    address: string,
    latitude: number,
    longitude: number,
};

export type OpenDataFranceReply = {
    lat:         number;
    lon:         number;
    citycode:    string;
    city:        string;
    name:        string;
    postcode:    string;
    housenumber: string;
};

/// OUT
export interface Movie {
    id: string;
    title: string;
    year: number;
    actors: string[];
    directors: string[];
    genres: string[];
    poster?: string;
    releaseDate?: string;
    countries?: string[];
    summary?: string;
}
export interface Cinema {
    id: string;
    name: string;
    url?: string;
    address: string;
    pos: {
        lat: number;
        lng: number;
    };
    zipCode?: string;
}
export interface Week {
    [dayname: string]: {
        VO?: string[];
        VF?: string[];
    };
}
export interface Schedule {
    movieId: string;
    cineId: string;
    week: Week;
}
export interface MoviesById {[movieId: string]: Movie; }
export interface ScheduleById {[scheduleId: string]: Schedule; }

export interface Database {
    schedules: {[scheduleId: string]: Schedule};
    movies: MoviesById;
    cinemas: {[cinemaId: string]: Cinema};
}
