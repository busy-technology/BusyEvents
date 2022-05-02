const BusySupply = require('./models/busy-supply');

module.exports = async () => {
  const busyExists = await BusySupply.find({});
  if (busyExists.length === 0) {
    const tokenEntry = await new BusySupply({
      tokenSymbol: 'BUSY',
      tokenAdmin: 'busy_network',
      totalSupply: '255000000000000000000000000',
    });

    await tokenEntry
      .save()
      .then(() => {
        console.log('Successfully saved busy token');
      })
      .catch((error) => {
        console.log('error saving busy', error);
      });
  }
};
