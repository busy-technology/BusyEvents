const User = require('./models/Users');
const IssuedTokensSchema = require('./models/issued-tokens');

module.exports = async (address, amount, token, tokentype) => {
  const user = await User.findOne({ walletId: address });

  if (!user) {
    console.log(`User with address ${address} does not exists`);
    return;
  }

  const userTokens = user.tokens;

  if (token in userTokens) {
    userTokens[token].balance = amount;
    userTokens[token].updateAt = new Date();
  } else {
    let tokenDetails;
    if (tokentype === 'busy20' && token !== 'BUSY') {
      console.log('here');
      tokenDetails = await IssuedTokensSchema.findOne({ tokenSymbol: token });
    }

    userTokens[token] = {
      balance: amount,
      type: tokentype,
      createdAt: new Date(),
      logoUrl: tokenDetails ? tokenDetails.metaData.logo : null,
      decimals: tokenDetails ? tokenDetails.tokenDecimals : null,
    };
  }

  await User.updateOne(
    { walletId: address },
    {
      $set: {
        tokens: userTokens,
      },
    },
  )
    .exec()
    .then(() => {
      if (token === 'BUSY') {
        console.log(
          `Updating wallet Balance for ${address} setting amount to ${amount} for token ${token}`,
        );
      } else {
        console.log(
          `Updating wallet Balance for ${address} setting amount to ${amount} for token ${token} of type ${tokentype}`,
        );
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};
