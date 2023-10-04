import { AudioTypes } from "./types";

export class State {
    public readonly songName: string;
    public readonly audioType: AudioTypes;
    public readonly backStartTime?: Date;

    constructor(songName: string, audioType: AudioTypes, backStartTime?: Date) {
        this.songName = songName;
        this.audioType = audioType;
        this.backStartTime = backStartTime;
    }

    get isInterruptable() {
        switch (this.audioType) {
            case AudioTypes.Motivational:
                return true;
            case AudioTypes.Interaction:
                return false;
            case AudioTypes.Song:
                return false;
            case AudioTypes.Background:
                return true;
            default:
                return false;
        }
    }
}

let state: State = new State('none', AudioTypes.Background);

export const setNewState = (newState: State) => {
    state = newState;
}

export const getState = () => {
    return state;
}
