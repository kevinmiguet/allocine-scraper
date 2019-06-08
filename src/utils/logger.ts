export const logger = {
    info: (str: string) => console.log(str),
    error: (str: string|Error) => console.log(typeof str === 'string' ? new Error(str) : str),
};
