import * as fs from 'fs';
import { Cinema, acPosition } from '../types';
import fetch from 'cross-fetch'

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

function getPositionInDatabase(cine: Cinema): acPosition {
    return positions.find((_cine: any) => _cine.id === cine.id)
}

export async function getPositionForCine(cine: Cinema): Promise<acPosition> {
    let pos = getPositionInDatabase(cine)
    if (pos) {
        return pos
    }
    // look for geoloc for Paris cinemas
    if (!cine.zipCode) {
        return null
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
        const pos = await getPositionForCine(cinemas[id])
        if (pos !== null && pos !== undefined) {
            cine.pos = {
                lat: pos.latitude,
                lng: pos.longitude
            }
            cinemasWithPos[id] = cine
        } else {
            if (cine.zipCode) {
                missing[id] = cine
            }
        }
    }

    fs.writeFileSync('./src/utils/cinePositions.json', JSON.stringify(positions, null, 4))
    fs.writeFileSync('./cinemas.json', JSON.stringify(cinemas, null, 4))
    fs.writeFileSync('./export/cinemas_pos.json', JSON.stringify(cinemasWithPos, null, 4))
    fs.writeFileSync('./export/cinemas_missing.json', JSON.stringify(missing, null, 4))
}

addPositions()
.then(() => console.log('done'))