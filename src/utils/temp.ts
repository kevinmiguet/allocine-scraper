import * as fs from 'fs';
const tempFolder = './tmp/';
import * as hash from 'object-hash';
import * as rimraf from 'rimraf';
import { Key } from '../main';

const getFileLocation = (key: string) => `${tempFolder}${key}.json`;
function createTmpFolderIfNecessary(): void {
    if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder);
    }
}

export async function saveAndGetKey(data: any, computeKeyFrom?: string): Promise<string> {
    const key = typeof computeKeyFrom === 'string' ? hash(computeKeyFrom) : hash(data);
    const fileLocation = getFileLocation(key);

    createTmpFolderIfNecessary();
    fs.writeFileSync(fileLocation, JSON.stringify(data));
    return key;
}

export async function get(_key: Key, notAKey?: boolean): Promise<any> {
    const key = notAKey ? hash(_key) : _key;
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
