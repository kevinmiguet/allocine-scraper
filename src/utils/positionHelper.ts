import * as fs from 'fs';
import { Cinema, acPosition } from '../types';
import fetch from 'cross-fetch';
import { promisify } from 'util';
import { database, getCine } from './database';
import { logger } from './utils';

interface OpenDataFranceReply {
    lat: number;
    lon: number;
    citycode: string;
    city: string;
    name: string;
    postcode: string;
    housenumber: string;
}

let positions: acPosition[] = require('./cinePositions.json');

const writeFileAsync = promisify(fs.writeFile);

function getPositionInDatabase(cine: Cinema): acPosition {
    return positions.find((positionData: acPosition) => positionData.cineId === cine.id);
}

export async function fetchCineAddress(cine: Cinema): Promise<acPosition> {
    let pos;

    // skip cinemas without zipcode
    if (!cine.zipCode) {
        return;
    }

    try {
        const rawReply = await fetch(`https://koumoul.com/s/geocoder/api/v1/coord?q=${cine.address}&postcode=${cine.zipCode}&city=Paris`);

        if (!rawReply.ok) {
            logger.error('error getting position');
            return;
        }
        const reply: OpenDataFranceReply = await rawReply.json();

        if (!reply) {
            logger.error('error with rawReply.json()');
            return;
        }
        pos = {
            cineId: cine.id,
            name: cine.name,
            address: cine.address,
            latitude: reply.lat,
            longitude: reply.lon,
        };
        // add cineAddress to cinePositions
        positions.push(pos);
        await writeFileAsync('./src/utils/cinePositions.json', JSON.stringify(positions, null, 4));
    } catch (err) {
        console.error(err);
    }
    return pos;
}

export function fixAddress(): void {
    // tslint:disable-next-line:forin
    for (let id in cinemas) {
        let cine = cinemas[id];
        // clean address to be as compatible as possible with cinePositions.json
        // removing starting '\n'
        cine.address = cine.address.replace(/^\n*/, '');
        // removing ending '\n'
        cine.address = cine.address.replace(/\n*$/, '');
        // replacing middle '\n' with ', '
        cine.address = cine.address.replace('\n', ', ');
        // set zipcode for Paris cinemas [750xx]
        const zipCode = cine.address.match(/750\d{2}/);
        if (zipCode && zipCode.length > 0) {
            cine.zipCode = zipCode[0];
        }
        cinemas[id] = cine;
    }
}
export async function addPositions(): Promise<void> {
    let cinemasWithPos: { [id: string]: Cinema } = {};
    let missing: { [id: string]: Cinema } = {};
    const { cinemas } = database;

    Object.keys(cinemas).forEach(async (id) => {
        let cine = getCine(id);
        const cineHasPos = cine.pos !== null;
        if (cineHasPos) {
            const shouldUpdateDatabase = !getPositionInDatabase(cine);
            if (shouldUpdateDatabase) {
                // add missing position to cinePositions.json
                positions.push({
                    cineId: cine.id,
                    name: cine.name,
                    address: cine.address,
                    latitude: cine.pos.lat,
                    longitude: cine.pos.lng,
                });
            }
            return;
        }
        let pos = getPositionInDatabase(cine);
        if (pos) {
            updateCinePos(cine, pos, cinemasWithPos, id);
        } else {
            pos = await fetchCineAddress(cine);
            if (pos) {
                updateCinePos(cine, pos, cinemasWithPos, id);
            } else if (cine.zipCode) {
                missing[id] = cine;
            }
        }
    });

    await writeFileAsync('./src/utils/cinePositions.json', JSON.stringify(positions, null, 4));
    await writeFileAsync('./cinemas.json', JSON.stringify(cinemas, null, 4));
    await writeFileAsync('./export/cinemas_pos.json', JSON.stringify(cinemasWithPos, null, 4));
    await writeFileAsync('./export/cinemas_missing.json', JSON.stringify(missing, null, 4));
}

addPositions()
    .then(() => console.log('done'));

function updateCinePos(cine: Cinema, pos: acPosition, cinemasWithPos: { [id: string]: Cinema; }, id: string): void {
    cine.pos = {
        lat: pos.latitude,
        lng: pos.longitude,
    };
    cinemasWithPos[id] = cine;
}
