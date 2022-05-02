const UpdateTotalSupply = require('./totalSupplyUpdate');
const UpdateBalance = require('./helper');
const transactionCollection = require('./models/transactions');
const UpdateBusyTotalSupply = require('./updateBusyTotalSupply');

module.exports = async (busy, payload) => {
  const useraddresses = payload.userAddresses;
  const balances = [];
  const totalSupplies = [];
  for (let i = 0; i < useraddresses.length; i += 1) {
    balances.push(
      busy.evaluateTransaction(
        'GetBalance',
        useraddresses[i].address,
        useraddresses[i].token,
      ),
    );

    totalSupplies.push(busy.evaluateTransaction('GetTotalSupply', 'BUSY'));
    if (useraddresses[i].token !== 'BUSY') {
      totalSupplies.push(
        busy.evaluateTransaction('GetTotalSupply', useraddresses[i].token),
      );
    }
  }
  const results = await Promise.all(balances);
  const totalSupplyResults = await Promise.all(totalSupplies);

  for (let i = 0; i < useraddresses.length; i += 1) {
    const resp = JSON.parse(results[i].toString());
    await UpdateBalance(
      useraddresses[i].address,
      resp.data,
      useraddresses[i].token,
      'busy20',
    );
  }

  for (let i = 0; i < totalSupplyResults.length; i += 1) {
    const totalSupply = JSON.parse(totalSupplyResults[i].toString());
    const stringArray = totalSupply.data.split(/(\s+)/);
    if (stringArray.length !== 3) {
      console.error(`something wrong ${stringArray}`);
    }
    if (stringArray[2] === 'BUSY') {
      await UpdateBusyTotalSupply(stringArray[2], stringArray[0]);
    } else {
      await UpdateTotalSupply(stringArray[2], stringArray[0]);
    }
  }

  // Inserting Transaction Fee

  await transactionCollection
    .updateOne(
      {
        transactionId: payload.transactionId,
      },
      {
        $set: {
          transactionFee: payload.transactionFee,
        },
      },
    )
    .exec()
    .then(() => {
      console.log(`Setting the transaction fee to ${payload.transactionFee}`);
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};
