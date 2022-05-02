const nftTokens = require('./models/nft-token');

module.exports = async (token, totalsupply) => {
  await nftTokens
    .updateOne(
      { tokenSymbol: token },
      {
        $set: {
          totalSupply: totalsupply,
        },
      },
    )
    .exec()
    .then(() => {
      console.log(
        `Updating NFT Total Supply for ${token} setting to ${totalsupply}`,
      );
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};
