
export default class OrderBook {

    public readonly asks: Array<{quantity: number, rate: number}> = [];
    public readonly bids: Array<{quantity: number, rate: number}> = [];
    public readonly fills: Array<{quantity: number, rate: number}> = [];
    public readonly cancels: Array<{quantity: number, rate: number}> = [];
    
    
}
