'use strict';

import {v4 as uuidv4} from 'uuid';

const { Contract } = require('fabric-contract-api');

class TradeTransfer extends Contract {
    async InitLedger(ctx) {
        const trades = [
            {
                ID: uuidv4(),
                Owner: 'Miguel Salinas',
                TradeType: 'Sell',
                Value: 5.2,
                Price: 55.2,
                CreationDate: new Date(),
            },
            {
                ID: uuidv4(),
                Owner: 'Jorge Carro',
                TradeType: 'Ask',
                Value: 2.1,
                Price: 50.1,
                CreationDate: new Date(),
            },
            {
                ID: uuidv4(),
                Owner: 'Raul Sanchez',
                TradeType: 'Sell',
                Value: 4,
                Price: 56.0,
                CreationDate: new Date(),
            },
            {
                ID: uuidv4(),
                Owner: 'Laura Montes',
                TradeType: 'Ask',
                Value: 1.4,
                Price: 49.8,
                CreationDate: new Date(),
            },
            {
                ID: uuidv4(),
                Owner: 'Maria Ley',
                TradeType: 'Ask',
                Value: 6,
                Price: 51.2,
                CreationDate: new Date(),
            },
            {
                ID: uuidv4(),
                Owner: 'Eddie Man',
                TradeType: 'Ask',
                Value: 3.6,
                Price: 50,
                CreationDate: new Date(),
            },
        ];

        for (const trade of trades) {            
            await ctx.stub.putState(trade.ID, Buffer.from(JSON.stringify(trade)));
            console.info(`Trade ${trade.ID} initialized`);
        }
    }

    // CreateTrade issues a new trade to the world state with given details.
    async CreateTrade(ctx, owner, tradeType, value, price, creationDate) {
        const trade = {
            ID: uuidv4(),
            Owner: owner,
            TradeType: tradeType,
            Value: value,
            Price: price,
            CreationDate: creationDate,
        };

        ctx.stub.putState(id, Buffer.from(JSON.stringify(trade)));

        return JSON.stringify(trade);
    }

    // ReadTrade returns the trade stored in the world state with given id.
    async ReadTrade(ctx, id) {
        const tradeJSON = await ctx.stub.getState(id); // get the trade from chaincode state

        if (!tradeJSON || tradeJSON.length === 0) {
            throw new Error(`The trade ${id} does not exist`);
        }

        return tradeJSON.toString();
    }

    // UpdateTrade updates an existing trade in the world state with provided parameters.
    async UpdateTrade(ctx, id, owner, tradeType, value, price) {
        const exists = await this.TradeExists(ctx, id);

        if (!exists) {
            throw new Error(`The trade ${id} does not exist`);
        }

        // overwriting original trade with new trade
        const updatedTrade = {
            ID: id,
            Owner: owner,
            TradeType: tradeType,
            Value: value,
            Price: price,
            CreationDate: new Date(),
        };

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedTrade)));
    }

    // DeleteTrade deletes an given trade from the world state.
    async DeleteTrade(ctx, id) {
        const exists = await this.TradeExists(ctx, id);

        if (!exists) {
            throw new Error(`The trade ${id} does not exist`);
        }

        return ctx.stub.deleteState(id);
    }

    // TradeExists returns true when trade with given ID exists in world state.
    async TradeExists(ctx, id) {
        const tradeJSON = await ctx.stub.getState(id);

        return tradeJSON && tradeJSON.length > 0;
    }

    // TransferTrade updates the owner field of trade with given id in the world state.
    async TransferTrade(ctx, id, owner, value, price) {
        const tradeString = await this.ReadTrade(ctx, id);

        const trade = JSON.parse(tradeString);

        trade.Owner = owner;
        trade.TradeType = 'Executed';
        trade.Value = value;
        trade.Price = price;

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(trade)));
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
}

module.exports = TradeTransfer;
