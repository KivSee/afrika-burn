import express from 'express';
import { exec } from 'child_process';
import mqtt, { ISubscriptionGrant } from 'mqtt';
import { BackgroundModes } from './types';
import { playBackground } from './service';
import { KIVSEE_TOOLS_DIR, PORT, RASP_HOST } from './config';

const app = express();
const mqttClient  = mqtt.connect(`mqtt://${RASP_HOST}`);

let latestBackground = BackgroundModes.Peacock;
let songFeedbackCallback: (triggerName: string) => void = () => {};

mqttClient.subscribe('trigger', (err: Error, granted: ISubscriptionGrant[]) => {
    mqttClient.on('message', (topic: string, payload: Buffer) => {
        console.log(payload.toString());
        const triggerName = JSON.parse(payload.toString()).trigger_name;
        songFeedbackCallback(triggerName);
        if(!triggerName) {
            playBackground(latestBackground);
        }
        console.log('got trigger', { triggerName });
    })
});

app.use('/background/:mode', async (req: express.Request, res: express.Response) => {
    const { mode } = req.params;
    const modeEnum = mode === BackgroundModes.Off ? BackgroundModes.Off :
        mode === BackgroundModes.Peacock ? BackgroundModes.Peacock :
        mode === BackgroundModes.Party ? BackgroundModes.Party :
        mode === BackgroundModes.Calm ? BackgroundModes.Calm :
        null;

    if(!modeEnum) {
        return res.status(404).send(`illegal mode "${mode}"`);
    }

    latestBackground = modeEnum;
    playBackground(modeEnum);

    res.sendStatus(200);
});

app.use('/song/:songName', async (req: express.Request, res: express.Response) => {

    const { songName } = req.params;

    if (songName !== 'nyan') {
        return res.status(404).send('currently only "nyan" is supported');
    }

    const songReceivedPromise = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            songFeedbackCallback = () => {}
            reject();
        }, 5000);
        songFeedbackCallback = (triggerName: string) => {
            if(triggerName === songName) {
                console.log('song started indication received from player');
                clearTimeout(timeoutId);
                songFeedbackCallback = () => {}
                resolve();
            }
        }    
    });

    console.log('executing kivsee tools');
    exec(`pipenv run python main.py -m seq -t ${songName}`, {
        cwd: KIVSEE_TOOLS_DIR
    }, async () => {
        console.log('kivsee tools done');
        await songReceivedPromise;
        console.log('finished playing song', { songName });
        res.sendStatus(200);
    });

});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
console.log('started afrika burn script');

