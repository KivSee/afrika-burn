import express from 'express';
import mqtt, { ISubscriptionGrant } from 'mqtt';
import { AudioTypes } from './types';
import { playSong } from './service';
import { BACK_TIMEOUT_MINS, PORT, RASP_HOST } from './config';
import { State, getState, setNewState } from './state';

const app = express();
const mqttClient = mqtt.connect(`mqtt://${RASP_HOST}`);

const supported_songs = ['req', 'overthinker', 'sandstorm'];

mqttClient.on('connect', () => {
    console.log('got connect signal from mqtt');
    console.log('playing background on first connect');
    setSong("peacock", AudioTypes.Background);
});

mqttClient.subscribe(['trigger', 'rfid/chip', 'button'], (err: Error, granted: ISubscriptionGrant[]) => {
});

mqttClient.on('message', (topic: string, payload: Buffer) => {
    switch (topic) {
        case 'trigger':
            return handleTrigger(payload);
        case 'button':
        case 'rfid/chip':
            return handleRfid(payload);
        default:
            console.log('go unexpected message on mqtt. ignoring it', { topic })
    }
});

const handleTrigger = async (payload: any) => {
    console.log('got trigger message', { payload: payload.toString() });
    const isPlaying = !!JSON.parse(payload.toString()).trigger_name;
    if (isPlaying) {
        return;
    }

    const { audioType, backStartTime } = getState();
    if (isBackgroundOver(backStartTime)) {
        console.log('background loop timed out. playing song');
        const randSong = supported_songs[Math.floor(Math.random() * supported_songs.length)];
        await setSong(randSong, AudioTypes.Song);
        return;
    }

    switch (audioType) {
        case AudioTypes.Interaction:
            console.log('audio was interaction speech. playing song');
            const randSong = supported_songs[Math.floor(Math.random() * supported_songs.length)];
            await setSong(randSong, AudioTypes.Song);
            return;
        case AudioTypes.Song:
            console.log('audio was song. playing advertisement speech');
            await setSong("speech_advertisement", AudioTypes.Motivational);
            return;
        case AudioTypes.Motivational:
            console.log('audio was motivational speech. playing background');
            await setSong("peacock", AudioTypes.Background);
            return;
        case AudioTypes.Background:
            console.log('audio was background. playing motivational speech');
            await setSong("speech_motivational", AudioTypes.Motivational);
            return;
    }
};

const isBackgroundOver = (backStartTime?: Date) => {
    if (!backStartTime) {
        return false;
    }
    const now = new Date();
    const diff = now.getTime() - backStartTime.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes > BACK_TIMEOUT_MINS;
}

const handleRfid = async (payload: any) => {
    console.log('got rfid message', { payload: payload.toString() });
    const state = getState();
    if (!state.isInterruptable) {
        console.log('not interruptable. ignoring rfid');
        return;
    }

    await setSong("speech_rfid", AudioTypes.Interaction);
    console.log('got rfid, playing speech', { payload: payload.toString() });
}

app.use('/song/:songName', async (req: express.Request, res: express.Response) => {

    const { songName } = req.params;

    if (!supported_songs.includes(songName)) {
        return res.status(404).send(`currently only ${supported_songs} is supported`);
    }

    await setSong(songName, AudioTypes.Song);

    res.sendStatus(200);
});

const setSong = async (songName: string, audioType: AudioTypes) => {
    console.log('sending song request to player');
    try {
        await playSong(songName);
        let newStartTime: Date | undefined;
        if (audioType === AudioTypes.Background || audioType === AudioTypes.Motivational) {
            let { backStartTime: previousBackStartTime } = getState();
            if (!previousBackStartTime) {
                newStartTime = new Date();
            } else {
                newStartTime = previousBackStartTime;
            }
        } else {
            newStartTime = undefined;
        }

        setNewState(new State(songName, audioType, newStartTime));
        console.log('started playing song', { songName, audioType });
    } catch (err) {
        console.log('failed to play song', { err, songName, audioType });
    }
};


app.listen(PORT, () => console.log(`listening on port ${PORT}`));
console.log('started tavasi midburn script');

