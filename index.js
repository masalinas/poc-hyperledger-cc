/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const tradeTransfer = require('./lib/tradeTransfer');

module.exports.TradeTransfer = tradeTransfer;
module.exports.contracts = [tradeTransfer];
