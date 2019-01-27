import * as fs from 'fs';
import { Database, Cinema } from '../clean-and-save';

const database: Database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
const positions: any = JSON.parse(fs.readFileSync('./src/utils/cinePositions.json', 'utf8'));
let orphelins: Cinema[] = [];
Object.keys(database.cinemas).map(cineK => {
    let cine = database.cinemas[cineK];
    const address = cine.address;
    const cineWithPos = positions.find((_cine: any) => _cine.address === address );
    if (cineWithPos) {
        database.cinemas[cineK] = {
            ...database.cinemas[cineK],
            pos: {
                lat: cineWithPos.latitude,
                lng: cineWithPos.longitude,
            },
        };
    } else {
        orphelins.push(cine);
    }
});
fs.writeFileSync('./database2.json', JSON.stringify(database, null, 4));
