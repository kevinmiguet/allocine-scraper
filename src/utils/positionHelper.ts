import { Cinema, Pos } from '../types';
import { logger } from './utils';
import fetch from 'node-fetch';

interface OpenDataFranceReply {
    lat: number;
    lon: number;
    citycode: string;
    city: string;
    name: string;
    postcode: string;
    housenumber: string;
}

export async function fetchCinePos(cine: Cinema): Promise<Pos> {
    // skip cinemas without zipcode
    if (!cine.zipCode) {
        logger.error(`cine ${cine.name} has no zipcode, can't get fetch its position !`);
        return;
    }

    try {
        // tslint:disable-next-line:max-line-length
        const url = `https://koumoul.com/s/geocoder/api/v1/coord?q=${cine.address.replace(/[^\w\d]+/g, '%20')}&postcode=${cine.zipCode}&city=Paris`.replace(/[ \,\-]/g, '%20');
        const rawReply = await fetch(url);

        if (!rawReply.ok) {
            logger.error('error getting position');
            return;
        }
        const reply: OpenDataFranceReply = await rawReply.json();

        if (!reply) {
            logger.error('error with rawReply.json()');
            return;
        }
        return {
            lat: reply.lat,
            lng: reply.lon,
        };
    } catch (err) {
        console.error(err);
    }
}

export function cleanAddress(rawAddress: string): string {
        // clean address to be as compatible as possible with cinePositions.json
        // removing starting '\n'
        return rawAddress.replace(/^\n*/, '')
        // removing ending '\n'
        .replace(/\n*$/, '')
        // replacing middle '\n' with ', '
        .replace('\n', ', ');
}
export function extractZipcode(address: string): string {
    const zipCode = address.match(/\d{5}/);
    if (zipCode && zipCode.length > 0) {
        return zipCode[0];
    }
    return null;
}
