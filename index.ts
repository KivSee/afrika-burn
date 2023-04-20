import express from 'express';
import mqtt, { ISubscriptionGrant } from 'mqtt';
import { BackgroundModes } from './types';
import { playBackground, playSong } from './service';
import { PORT, RASP_HOST } from './config';

const app = express();
const mqttClient = mqtt.connect(`mqtt://${RASP_HOST}`);

let latestBackground = BackgroundModes.Peacock;
let isPlayingSong = false;

mqttClient.on('connect', () => {
    console.log('got connect signal from mqtt');
    if(!isPlayingSong) {
        console.log('playing background on first connect');
        setBackground(latestBackground);
    }
});

mqttClient.subscribe(['trigger', 'rfid/chip'], (err: Error, granted: ISubscriptionGrant[]) => {
});

mqttClient.on('message', (topic: string, payload: Buffer) => {
    switch (topic) {
        case 'trigger':
            return handleTrigger(payload);
        case 'rfid/chip':
            return handleRfid(payload);
        default:
            console.log('go unexpected message on mqtt. ignoring it', { topic })
    }
});

const handleTrigger = async (payload: any) => {
    console.log('got trigger message', { payload: payload.toString() });
    const triggerName = JSON.parse(payload.toString()).trigger_name;
    if (!triggerName && latestBackground !== BackgroundModes.Off) {
        setBackground(latestBackground);
    }
    console.log('got trigger', { triggerName });
};

const handleRfid = async (payload: any) => {
    console.log('got rfid message', { payload: payload.toString() });
    if (isPlayingSong) {
        console.log('already playing a song. ignoring rfid');
        return;
    }

    const message = JSON.parse(payload.toString());

    const { song } = message;
    switch (song) {
        case 1:
            return await setSong('req');
        case 2:
            return await setSong('sandstorm');
        case 3:
            return await setSong('overthinker');
        case 4:
            return await setBackground(BackgroundModes.Off);
        case 5:
            return await setBackground(BackgroundModes.Calm);
        case 6:
            return await setBackground(BackgroundModes.Party);
        case 7:
            return await setBackground(BackgroundModes.Peacock);
        default:
            console.log('got unknown song. ignoring it', { song });
    }
}

app.use('/background/:mode', async (req: express.Request, res: express.Response) => {
    const { mode } = req.params;
    const modeEnum = mode === BackgroundModes.Off ? BackgroundModes.Off :
        mode === BackgroundModes.Peacock ? BackgroundModes.Peacock :
            mode === BackgroundModes.Party ? BackgroundModes.Party :
                mode === BackgroundModes.Calm ? BackgroundModes.Calm :
                    null;

    if (!modeEnum) {
        return res.status(404).send(`illegal mode "${mode}"`);
    }

    await setBackground(modeEnum);

    res.sendStatus(200);
});

app.use('/song/:songName', async (req: express.Request, res: express.Response) => {

    const { songName } = req.params;

    const supported_songs = ['req', 'overthinker', 'sandstorm'];
    if (!supported_songs.includes(songName)) {
        return res.status(404).send(`currently only ${supported_songs} is supported`);
    }

    await setSong(songName);

    res.sendStatus(200);
});

const setBackground = async (mode: BackgroundModes) => {
    latestBackground = mode;
    try {
        playBackground(mode);
    } catch (err) {
        console.log('failed to play background', { err });
    }
    isPlayingSong = false;
};

const setSong = async (songName: string) => {
    console.log('sending song request to player');
    try {
        await playSong(songName);
        isPlayingSong = true;
        console.log('started playing song', { songName });
    } catch (err) {
        console.log('failed to play song', { err, songName });
    }
};

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
console.log('started afrika burn script');

