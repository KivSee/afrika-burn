import axios from 'axios';
import { RASP_HOST } from './config';
import { BackgroundModes } from './types';

export const playBackground = async (mode: BackgroundModes) => {
    switch (mode) {
        case BackgroundModes.Off:
            return await axios.post(`http://${RASP_HOST}:8083/stop`);
        case BackgroundModes.Party:
            return await axios.post(`http://${RASP_HOST}:8083/trigger/purim`);
        case BackgroundModes.Peacock:
            return await axios.post(`http://${RASP_HOST}:8083/song/peacock/play`);
    }

}

export const playSong = async (songName: string) => {
    return await axios.post(`http://${RASP_HOST}:8083/song/${songName}/play`);
}