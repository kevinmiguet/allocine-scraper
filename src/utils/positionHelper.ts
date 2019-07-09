import * as fs from 'fs';
import { Cinema, acPosition } from '../types';
import fetch from 'cross-fetch'
import { promisify } from 'util';

interface OpenDataFranceReply {
    lat:         number;
    lon:         number;
    citycode:    string;
    city:        string;
    name:        string;
    postcode:    string;
    housenumber: string;
}

let positions: acPosition[] = require('./cinePositions.json');
let cinemas: { [id: string]: Cinema } = require('../../cinemas.json');

const writeFileAsync = promisify(fs.writeFile)

function getPositionInDatabase(cine: Cinema): acPosition {
    return positions.find((_cine: any) => _cine.id === cine.id)
}

export async function fecthCineAddress(cine: Cinema) : Promise<acPosition> {
    let pos = undefined

    // skip cinemas without zipcode
    if (!cine.zipCode) {
        return pos
    }

    try {
        const rawReply = await fetch(`https://koumoul.com/s/geocoder/api/v1/coord?q=${cine.address}&postcode=${cine.zipCode}&city=Paris`)
    
        if (rawReply.ok) {
            const reply = await rawReply.json() as OpenDataFranceReply
            if (reply) {
                pos = {
                    cineId: cine.id,
                    name: cine.name,
                    address: cine.address,
                    latitude: reply.lat,
                    longitude: reply.lon
                }

                positions.push(pos)
                await writeFileAsync('./src/utils/cinePositions.json', JSON.stringify(positions, null, 4))
            }
        } else {
            console.error('error getting position')
        }
    } catch (err) {
        console.error(err)
    }
    return pos
}

export function fixAddress() {
    for (let id in cinemas) {
        let cine = cinemas[id]
        // clean address to be as compatible as possible with cinePositions.json
        // removing starting '\n'
        cine.address = cine.address.replace(/^\n*/, '')
        // removing ending '\n'
        cine.address = cine.address.replace(/\n*$/, '')
        // replacing middle '\n' with ', '
        cine.address = cine.address.replace('\n', ', ')
        // set zipcode for Paris cinemas [750xx]
        const zipCode = cine.address.match(/750\d{2}/)
        if (zipCode && zipCode.length > 0) {
            cine.zipCode = zipCode[0]
        }
        cinemas[id] = cine
    }
}

export async function addPositions() {
    let cinemasWithPos: {[id: string]: Cinema} = {}
    let missing: {[id: string]: Cinema} = {}
    for (let id in cinemas) {
        let cine = cinemas[id]
        if (cine.pos !== null) {
            if (!getPositionInDatabase(cine)) {
                // add missing position to cinePositions.json
                const pos = {
                    cineId: cine.id,
                    name: cine.name,
                    address: cine.address,
                    latitude: cine.pos.lat,
                    longitude: cine.pos.lng
                }
                positions.push(pos)
            }
            continue
        }
        let pos = getPositionInDatabase(cinemas[id])
        if (pos !== null && pos !== undefined) {            
            updateCinePos(cine, pos, cinemasWithPos, id);
        } else {
            pos = await fecthCineAddress(cinemas[id])
            if (pos !== null && pos !== undefined) {
                updateCinePos(cine, pos, cinemasWithPos, id);
            } else if (cine.zipCode) {
                missing[id] = cine
            }
        }
    }

    await writeFileAsync('./src/utils/cinePositions.json', JSON.stringify(positions, null, 4))
    await writeFileAsync('./cinemas.json', JSON.stringify(cinemas, null, 4))
    await writeFileAsync('./export/cinemas_pos.json', JSON.stringify(cinemasWithPos, null, 4))
    await writeFileAsync('./export/cinemas_missing.json', JSON.stringify(missing, null, 4))
}

addPositions()
.then(() => console.log('done'))

function updateCinePos(cine: Cinema, pos: acPosition, cinemasWithPos: { [id: string]: Cinema; }, id: string) {
    cine.pos = {
        lat: pos.latitude,
        lng: pos.longitude
    };
    cinemasWithPos[id] = cine;
}
