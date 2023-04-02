import axios from 'axios';
import { RASP_HOST } from './config';
import { BackgroundModes } from './types';

export const playBackground = async (mode: BackgroundModes) => {
    switch (mode) {
        case BackgroundModes.Off:
            await axios.post(`http://${RASP_HOST}:8083/stop`);
        case BackgroundModes.Party:
            await axios.post(`http://${RASP_HOST}:8083/trigger/purim`);
        case BackgroundModes.Peacock:
            await axios.post(`http://${RASP_HOST}:8083/song/peacock/play`);
    }

}
