const BusySupply = require('./models/busy-supply');

module.exports = async (token, supply) => {
  const busyExists = await BusySupply.find({});
  if (busyExists.length !== 0) {
    const resp = await BusySupply.updateOne(
      { tokenSymbol: token },
      {
        $set: {
          totalSupply: supply,
        },
      },
    );

    if (resp.matchedCount === 1) {
      console.log(`Updating total Supply for ${token} setting to ${supply}`);
    }
  }
};
