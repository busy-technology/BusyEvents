const IssuetokenTransactions = require('./models/issued-tokens');

module.exports = async (token, totalSupply) => {
  await IssuetokenTransactions.updateOne(
    { tokenSymbol: token },
    {
      $set: {
        tokenSupply: totalSupply,
      },
    },
  )
    .exec()
    .then(() => {
      console.log(
        `Updating Total Supply for ${token} setting to ${totalSupply}`,
      );
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};
