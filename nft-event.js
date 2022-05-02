const balanceHandler = require('./balance-event');
const UpdateBalance = require('./helper');
const UpdateNftTotalSupply = require('./totalSupplyNftUpdate');

module.exports = async (busy, payload) => {
  console.log(payload);
  if (Object.keys(payload.userAddress).length !== 0) {
    payload.userAddresses = [payload.userAddress];
    // updating default wallet Balance
    await balanceHandler(busy, payload);
  }

  const { nftEventInfo } = payload;

  if (nftEventInfo) {
    const accounts = [];
    const symbols = [];
    const tokenTypes = [];
    let balances;
    for (let i = 0; i < nftEventInfo.length; i += 1) {
      accounts.push(nftEventInfo[i].account);
      symbols.push(nftEventInfo[i].symbol);
      tokenTypes.push(nftEventInfo[i].tokenType);
    }

    const result = await busy.evaluateTransaction(
      'BusyTokens:BalanceOfBatch',
      JSON.stringify(accounts),
      JSON.stringify(symbols),
    );
    const resp = JSON.parse(result.toString());

    const totalSuppliesResponse = await busy.evaluateTransaction(
      'BusyTokens:GetTotalSupplyNftBatch',
      JSON.stringify(symbols),
    );

    const totalSuppliesResp = JSON.parse(totalSuppliesResponse.toString());
    const updateNftSupply = [];
    for (let i = 0; i < totalSuppliesResp.data.length; i += 1) {
      const totalSupply = totalSuppliesResp.data[i];
      const stringArray = totalSupply.split(/(\s+)/);
      if (stringArray.length !== 3) {
        console.error(`something wrong ${stringArray}`);
      }
      updateNftSupply.push(
        UpdateNftTotalSupply(stringArray[2], stringArray[0]),
      );
    }
    if (resp.success) {
      balances = resp.data;
    } else {
      console.error('error in logging the balance', resp.message);
    }

    for (let i = 0; i < accounts.length; i += 1) {
      await UpdateBalance(accounts[i], balances[i], symbols[i], tokenTypes[i]);
    }
    await Promise.all(updateNftSupply);
  } else {
    console.error('Error in the event data');
  }
};
