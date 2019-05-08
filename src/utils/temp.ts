import * as fs from 'fs';
const tempFolder = './tmp/';
import * as hash from 'object-hash';
import * as rimraf from 'rimraf';

const getFileLocation = (key: string) => `${tempFolder}${key}.json`;
function createTmpFolderIfNecessary(): void {
    if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder);
    }
}
export async function save(data: any, _key: string): Promise<void> {
    const key = hash(_key);
    const fileLocation = getFileLocation(key);
    // we want to throw if we call it while data already exists
    if (fs.existsSync(fileLocation)) {
        return Promise.reject(new Error('temp file for this already exists, should not call save'));
    }
    createTmpFolderIfNecessary();
    fs.writeFileSync(fileLocation, JSON.stringify(data));
}

export async function get(_key: string): Promise<any> {
    const key = hash(_key);
    const fileLocation = getFileLocation(key);
    const fileExists = fs.existsSync(fileLocation);

    if (!fileExists) {
        return false;
    }
    return JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
}

export function clean(): void {
    rimraf.sync(tempFolder);
}
