import * as fs from 'fs';
const tempFolder = './tmp/';
import * as hash from 'object-hash';
import * as rimraf from 'rimraf';
import { Key } from '../main';
import { logger } from './logger';

const getFileLocation = (key: string) => `${tempFolder}${key}.json`;
function createTmpFolderIfNecessary(): void {
    if (!fs.existsSync(tempFolder)) {
        logger.info(`creating tmp folder`);
        fs.mkdirSync(tempFolder);
    }
}

export async function saveAndGetKey(data: any, computeKeyFrom?: string): Promise<string> {
    const key = typeof computeKeyFrom === 'string' ? hash(computeKeyFrom) : hash(data);
    const fileLocation = getFileLocation(key);
    logger.info(`writing tmp file ${computeKeyFrom === 'string' ? computeKeyFrom : key}`);
    createTmpFolderIfNecessary();
    fs.writeFileSync(fileLocation, JSON.stringify(data));
    return key;
}

export async function get(_keyOrStringToComputeKeyFrom: Key, notAKey?: boolean): Promise<any> {
    const key = notAKey ? hash(_keyOrStringToComputeKeyFrom) : _keyOrStringToComputeKeyFrom;
    const fileLocation = getFileLocation(key);
    const fileExists = fs.existsSync(fileLocation);
    if (!fileExists) {
        return false;
    }
    logger.info(`getting tmp file ${_keyOrStringToComputeKeyFrom}`);
    return JSON.parse(fs.readFileSync(fileLocation, 'utf8'));
}

export function clean(): void {
    logger.info('cleaning tmp folder');
    rimraf.sync(tempFolder);
}
