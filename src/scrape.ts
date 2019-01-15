import * as cheerio from 'cheerio';
import { allocineScrap, acMovieTime } from './clean-and-save';
/*
Schema - Allocine
http://www.allocine.fr/salle/cinemas-pres-de-115755/?page=n
===============================
    <Cinema .theaterblock >
        Metadata    .j_entities
        <Jour .pane>
            <Film-Metadata  .j_w>   data-movie
                vo/vf       span.bold
                3D/imax...  span.bold
            </Film>
            <Film-Horaire .times>
                Seances     em
            <Film-Horaire>
        </Jour>
    </Cinema>
*/
const jsonIfy = (input: any): JSON => {
    if (typeof input === 'string') {
        // was jsonIfied by cheerio because some chars were not escaped. doing this.
        input = input.replace(/([\w ]) "/gi, '$1 \\"');
        input = input.replace(/" ([\w ])/gi, '\\" $1');
        return JSON.parse(input);
    }
    return input;
};

export const scrap = (html: string): Promise<allocineScrap[]> => {
    const $ = cheerio.load(html);
    const result: allocineScrap[] = $('.theaterblock.j_entity_container') // <Cinema>
    .map((id, cineNode) => {
        const schedule = $(cineNode).find('.pane')                     // <Jour>
        .map((_id, dayNode) => {
            // Id of this day
            const movieDatas = $(dayNode).find('.j_w')                  // <Film-Metadata>
            .map((i, movieMetadataNode) => {
                return {
                    // movie metadata
                    movie: jsonIfy($(movieMetadataNode).data('movie')),
                    // vo/vf...
                    version: $(movieMetadataNode).find('span.bold').first().text(),
                    // numerique/imax...
                    quality: $(movieMetadataNode).find('span.bold').last().text(),
                };
            }).get();
            // array of movies times
            const movieTimes: acMovieTime[][] = [];
            $(dayNode).find('.times')                               // <Film-Horaire>
                // cheerio maps fucks up here
                .each((i, movieTimesNode) => {
                    const seanceNodes = $(movieTimesNode).find('em');
                    const seancesPourCeFilm: acMovieTime[] = [];
                    $(seanceNodes).each((_i, seanceNode) => {
                        seancesPourCeFilm.push({
                            debut: $(seanceNode).data('times')[0],
                            fin: $(seanceNode).data('times')[2],
                        });
                    });
                    movieTimes.push(seancesPourCeFilm);
                });

            const dayId = $(dayNode).attr('rel');
            return {
                dayId,
                movieDatas,
                movieTimes,
            };
        }).get();
        // days Names
        const days = $(cineNode).find('ul.items > li > a').map((i, a) => $(a).data()).get();
        const cinemaData = {
            name :  $(cineNode).find('h2 > a').text(),
            id: $(cineNode).find('.j_entities').data('entities').entityId,
            address: $(cineNode).find('.lighten').text(),
        };
        return {
            cinemaData,
            days,
            schedule,
        };

    }).get();
    return Promise.resolve(result);
};
