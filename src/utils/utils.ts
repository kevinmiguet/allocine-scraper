export const logger = {
    info: (str: string) => console.log(str),
    error: (str: string|Error) => console.log(typeof str === 'string' ? new Error(str) : str),
};

export const normalizeText = (txt: string): string => {
    return txt
        .replace(/\n/g, '')
        .replace(/\\n/g, '')
        .replace(/ +/g, ' ')
        .replace(/^ /, '')
        .replace(/ $/, '');
};

export const normalizeDate = (stringDate: string): string => {
    const monthIndexes = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
    const isMonth = ((s: string) => /^(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)$/.test(s));
    const isYear = ((s: string) => /^\d{4}$/.test(s));
    const isDay = ((s: string) => /^\d{1,2}$/.test(s));
    const date =
    normalizeText(
    removeDiacritics(stringDate))
    .toLowerCase()
    .split(' ')
    .reduce((_date, part) => {
        if (isMonth(part)) {
            _date.month = monthIndexes.indexOf(part);
        } else if (isYear(part)) {
            _date.year = parseInt(part, 10);
        } else if (isDay(part)) {
            _date.day = parseInt(part, 10);
        }
        return _date;
    }, {month: 0, day: 0, year: 0});

    return new Date(
        date.year,
        date.month,
        date.day,
    ).toDateString();
};
// cf : https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
const removeDiacritics = (str: string): string => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');



export const getPreviousWednesday = (date: Date): Date => {
    if (date.getDay() === 3) {
        return date;
    }
    const diffFromWednesdayMap = {
        0: 4,
        1: 5,
        2: 6,
        3: 0, // Wednesday
        4: 1,
        5: 2,
        6: 3,
    };
    const diffFromWednesday = diffFromWednesdayMap[date.getDay()];
    const wednesday = new Date();
    // Dirty JS hack vv
    // it also handle cases when
    // previous wednesday is from previous month or year
    return new Date((wednesday.setDate(date.getDate() - diffFromWednesday)));
};

// ignores hours by comparing toDateString(), ie. "Sun Jul 22 2018"
export const isSameDay = (date1: Date|string, date2: Date|string): boolean => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
};
