import { google, youtube_v3 } from 'googleapis';
import { logger } from './utils';

// initialize the Youtube API library
const youtube = google.youtube({
    version: 'v3',
    auth: 'AIzaSyA97mUqVeEm2Zxfntt7A6SZAmP_bkYKPKQ',
});

export async function searchYoutube(request: string): Promise<youtube_v3.Schema$SearchListResponse> {
    const res = await youtube.search.list({
        part: 'id,snippet',
        q: request,
    })

    .catch((err) => {
        if (err.message.includes('quota')) {
            logger.error('youtube api quota error !');
        }
        return Promise.reject();
    });

    return res.data;
}
