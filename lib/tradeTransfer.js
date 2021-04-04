'use strict';

const { v4: uuidv4 } = require('uuid');
const { Contract } = require('fabric-contract-api');

class TradeTransfer extends Contract {
    async InitLedger(ctx) {
        const trades = [
            {
                ID: '2d2e1c76-7263-4f99-b46a-df2429f7fb35',
                Owner: 'Miguel Salinas',
                TradeType: 'Sell',
                Value: 5,
                Price: 55,
                CreationDate: '2021-04-03T19:32:39+00:00'
            },
            {
                ID: '26278c76-68ef-464d-b05f-734199bbf062',
                Owner: 'Jorge Carro',
                TradeType: 'Ask',
                Value: 2,
                Price: 50,
                CreationDate: '2021-04-03T19:32:39+00:00',
            },
            {
                ID: '4213c71e-e158-47a6-a466-65a9938089d1',
                Owner: 'Raul Sanchez',
                TradeType: 'Sell',
                Value: 4,
                Price: 56,
                CreationDate: '2021-04-03T19:32:39+00:00',
            },
            {
                ID: 'f038f3cb-9998-4c28-a7a6-a485aaf38801',
                Owner: 'Laura Montes',
                TradeType: 'Ask',
                Value: 1,
                Price: 49,
                CreationDate: '2021-04-03T19:32:39+00:00',
            },
            {
                ID: '8f09911e-d090-4efe-aaee-8e224ff317ef',
                Owner: 'Maria Ley',
                TradeType: 'Ask',
                Value: 6,
                Price: 51,
                CreationDate: '2021-04-03T19:32:39+00:00',
            },
            {
                ID: 'f365eebc-9161-4a8e-b318-6b5d086e60fb',
                Owner: 'Eddie Man',
                TradeType: 'Ask',
                Value: 3,
                Price: 50,
                CreationDate: '2021-04-03T19:32:39+00:00',
            }
        ];        

        for (const trade of trades) {  
            await ctx.stub.putState(trade.ID, Buffer.from(JSON.stringify(trade)));
            console.info(`Trade ${trade.ID} initialized`);
        }
    }

    // TradeExists returns true when trade with given ID exists in world state.
    async TradeExists(ctx, id) {
        const tradeJSON = await ctx.stub.getState(id);

        return tradeJSON && tradeJSON.length > 0;
    }

    // GetAllTrades returns all trades found in the world state.
    async GetAllTrades(ctx) {
        const allResults = [];

        // range query with empty string for startKey and endKey does an open-ended query of all trades in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');

        let result = await iterator.next();
        
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;

            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }

            allResults.push({ Key: result.value.key, Record: record });

            result = await iterator.next();
        }

        return JSON.stringify(allResults);
    }

    // ReadTrade returns the trade stored in the world state with given id.
    async ReadTrade(ctx, id) {
        const tradeJSON = await ctx.stub.getState(id); // get the trade from chaincode state

        if (!tradeJSON || tradeJSON.length === 0) {
            throw new Error(`The trade ${id} does not exist`);
        }

        return tradeJSON.toString();
    }

    // CreateTrade issues a new trade to the world state with given details.
    async CreateTrade(ctx, id, owner, tradeType, value, price, creationDate) {
        const trade = {
            ID: id,
            Owner: owner,
            TradeType: tradeType,
            Value: value,
            Price: price,
            CreationDate: creationDate,
        };

        ctx.stub.putState(id, Buffer.from(JSON.stringify(trade)));

        return JSON.stringify(trade);
    }

    // UpdateTrade updates an existing trade in the world state with provided parameters.
    async UpdateTrade(ctx, id, owner, tradeType, value, price, updatedDate) {
        const tradeString = await this.ReadTrade(ctx, id);

        const trade = JSON.parse(tradeString);

        trade.Owner = owner;
        trade.TradeType = tradeType;
        trade.Value = value;
        trade.Price = price;
        trade.UpdatedDate = updatedDate;

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(trade)));
    }

    // DeleteTrade deletes an given trade from the world state.
    async DeleteTrade(ctx, id) {
        const exists = await this.TradeExists(ctx, id);

        if (!exists) {
            throw new Error(`The trade ${id} does not exist`);
        }

        return ctx.stub.deleteState(id);
    }

    // ExecutedTrade execute a trade between two owners in the world state.
    async ExecutedTrade(ctx, idSell, idBuy, price) {
        const tradeSellString = await this.ReadTrade(ctx, idSell);
        const tradeBuyString = await this.ReadTrade(ctx, idBuy);

        const tradeSell = JSON.parse(tradeSellString);
        const tradeBuy = JSON.parse(tradeBuyString);

        if (tradeSell.value > tradeBuy.value) 
        {
            tradeSell.value = tradeSell.value - tradeBuy.value;

            // update sell trade
            this.UpdateTrade(ctx, tradeSell.Id, tradeSell.Owner, tradeSell.TradeType, tradeSell.Value, tradeSell.Price, new Date().toISOString());

            // delete buy trade
            this.DeleteTrade(ctx, tradeBuy.Id);
        } 
        else if (tradeSell.value === tradeBuy.value) 
        {
            // delete sell trade
            this.DeleteTrade(ctx, tradeSell.Id);

            // delete buy trade
            this.DeleteTrade(ctx, tradeBuy.Id);
        } 
        else {
            tradeBuy.value = tradeBuy.value - tradeSell.value;

            // delete sell trade
            this.DeleteTrade(ctx, tradeSell.Id);            

            // update buy trade
            this.UpdateTrade(ctx, tradeSell.Id, tradeSell.Owner, tradeSell.TradeType, tradeSell.Value, tradeSell.Price, new Date().toISOString());            
        }

        // create a new executed trade
        return this.CreationDate(ctx, uuidv4(), tradeBuy.Owner, 'Executed', tradeBuy.Value, price, new Date().toISOString());
    }
}

module.exports = TradeTransfer;
