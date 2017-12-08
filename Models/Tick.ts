export default class Tick {
    public spread: number;

    constructor(public marketName: string,
                public bid: number,
                public ask: number,
                public last: number,
                public timestamp: number) {
        this.spread = ask - bid;
    }
}
