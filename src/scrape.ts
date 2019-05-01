import * as cheerio from 'cheerio';
import { allocineScrap, acMovieTime } from './clean-and-save';

const jsonIfy = (input: any): JSON => {
    if (typeof input === 'string') {
        // was jsonIfied by cheerio because some chars were not escaped. doing this.
        input = input.replace(/\[""\]/gi, '[]');
        input = input.replace(/([\w ]) "/gi, '$1 \\"');
        input = input.replace(/" ([\w ])/gi, '\\" $1');
        input = input.replace(/"(")/gi, '\\"$1');
        return JSON.parse(input);
    }
    return input;
};

const getVersion = (els: CheerioElement[], $: CheerioStatic): string => {
    const node = els.find(el => {
        const match = $(el).text().match(/[VOF]/g);
        return match !== null;
    });
    const value = $(node).text();
    // VF by default
    return node ? value.replace('En ', '') : 'VF';
};
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
export const scrap = (html: string): Promise<allocineScrap[]> => {
    const $ = cheerio.load(html);
    const result: allocineScrap[] = $('.theaterblock.j_entity_container') // <Cinema>
    .map((id, cineNode) => {
        const schedule = $(cineNode).find('.pane')                     // <Jour>
        .map((_id, dayNode) => {
            // Id of this day
            const movieDatas = $(dayNode).find('.j_w')                  // <Film-Metadata>
            .map((i, movieMetadataNode) => {
                const otherMetadataNodes = $(movieMetadataNode).find('span.bold').map((k, n) => $(n)).toArray();
                return {
                    // movie metadata
                    movie: jsonIfy($(movieMetadataNode).data('movie')),
                    // vo/vf...
                    version: getVersion(otherMetadataNodes, $),
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
            url :  $(cineNode).find('h2 > a').attr('href'),
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
/*
Schema - Allocine - cinema page
http://www.allocine.fr/seance/salle_gen_csalle=C0013.html
===============================
*/

export const scrapForMoviePage = (html: string): Promise<any> => {
    const $ = cheerio.load(html);
    const interestingNodes = $('.js-movie-list');
    if (interestingNodes.length === 0) {
        return Promise.resolve(null);
    }
    return Promise.resolve($(interestingNodes[0]).data().moviesShowtimes);
};
