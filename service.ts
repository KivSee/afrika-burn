import { RASP_HOST } from './config';
import axiosRetry from 'axios-retry';
import axios from 'axios';
axiosRetry(axios, { retries: 10, retryDelay: () => 5000 });


export const playSong = async (songName: string) => {
    return await axios.post(`http://${RASP_HOST}:8083/song/${songName}/play`);
}