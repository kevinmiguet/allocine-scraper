import { Cinema } from '../types';
import { fetchCinePos } from '../utils/positionHelper';
import { setCine } from '../utils/database';

export async function setCinePositionsAsync(cinemas: Cinema[]): Promise<void> {
    // add position
    await Promise.all(cinemas.map(async (cine) => {
        try {
            console.log('getting pos for cine ' + cine.name);
            const pos = await fetchCinePos(cine);
            if (pos) {
                cine.pos = pos;
            }
            setCine(cine);
        } catch (err) {
            console.error('error in cleanAndSaveCineData: ' + err);
        }
    }));
}
