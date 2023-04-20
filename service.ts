import { RASP_HOST } from './config';
import { BackgroundModes } from './types';
import axiosRetry from 'axios-retry';
import axios from 'axios';
axiosRetry(axios, { retries: 10, retryDelay: () => 5000 });

export const playBackground = async (mode: BackgroundModes) => {
    switch (mode) {
        case BackgroundModes.Off:
            return await axios.post(`http://${RASP_HOST}:8083/stop`, {}, { timeout: 60 * 1000 });
        case BackgroundModes.Party:
            return await axios.post(`http://${RASP_HOST}:8083/trigger/purim`, {}, { timeout: 60 * 1000 });
        case BackgroundModes.Peacock:
            return await axios.post(`http://${RASP_HOST}:8083/song/peacock/play`, {}, { timeout: 60 * 1000 });
    }

}

export const playSong = async (songName: string) => {
    return await axios.post(`http://${RASP_HOST}:8083/song/${songName}/play`);
}