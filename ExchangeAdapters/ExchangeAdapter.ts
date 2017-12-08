import Order from "../Models/Order";
import Quote from "./../Models/Quote";

export default interface IExchangeAdapter {

    buyMarket(quote: Quote): Promise<Order>;
    sellMarket(quote: Quote): Promise<Order>;

}
