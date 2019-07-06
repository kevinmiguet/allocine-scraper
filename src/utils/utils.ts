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
