import {OrderSide, OrderType} from "./Order";

export default class Quote {

    constructor(public readonly marketName: string,
                public readonly rate: number,
                public readonly quantity: number,
                public readonly side: OrderSide,
                public readonly type: OrderType) {

    }

}
