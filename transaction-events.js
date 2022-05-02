const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const Blocks = require('./models/blocks');
const transactionCollection = require('./models/transactions');

async function updateTransaction(transaction, event, blockNumber) {
  const blockResponse = event.blockData;
  await transactionCollection
    .updateOne(
      {
        transactionId: transaction.transactionId,
      },
      {
        $set: {
          dataHash: blockResponse.header.data_hash.toString('hex'),
          blockNum: blockNumber,
          updateTime: new Date(),
          status: transaction.status,
        },
      },
    )
    .exec()
    .then(() => {
      console.log('Updated the transaction status');
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
}

async function addBlock(event, transacns) {
  const blockResponse = event.blockData;
  const blocknum = blockResponse.header.number;
  const txcount = blockResponse.data.data.length;
  const datahash = blockResponse.header.data_hash.toString('hex');
  const previousHash = blockResponse.header.previous_hash.toString('hex');

  const blockExists = await Blocks.findOne({
    blockNum: blocknum,
  });
  if (blockExists) {
    console.log('Block Already Exists Skipping the Insert to blocks table');
    return;
  }
  const blockEntry = await new Blocks({
    blockNum: blocknum,
    txCount: txcount,
    dataHash: datahash,
    preHash: previousHash,
    blockHash: datahash,
    transactions: transacns,
    createdDate: new Date(),
  });

  await blockEntry
    .save()
    .then(() => {
      console.log(`Block ${blocknum} recorded successfully`);
    })
    .catch((error) => {
      console.log('ERROR DB', error);
    });

  await Blocks.updateOne(
    {
      blockNum: blocknum - 1,
    },
    {
      $set: {
        blockHash: previousHash,
      },
    },
  )
    .exec()
    .then(() => {
      console.log('Updating Previous Block Hash');
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
}

module.exports = async () => {
  const gateway = new Gateway();
  // load the network configuration
  const ccpPath = path.resolve(
    __dirname,
    'connection-profile',
    'connection-busy.json',
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  // Create a new file system based wallet for managing identities.
  const walletPath = path.join(process.cwd(), 'network', 'wallet');
  // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  await gateway.connect(ccp, {
    wallet,
    identity: 'busy_network',
    discovery: {
      enabled: true,
      asLocalhost: false,
    },
  });
  const network = await gateway.getNetwork('busychannel');
  const listener = async (event) => {
    const transactions = event.getTransactionEvents();
    const { blockNumber } = event;
    const transactionCopy = [];
    const updateTransactions = [];
    for (let i = 0; i < transactions.length; i += 1) {
      const obj = {};
      Object.keys(transactions[i]).forEach((key) => {
        if (key !== 'transactionData') {
          obj[key] = transactions[i][key];
        }
      });
      transactionCopy.push(obj);
      updateTransactions.push(
        updateTransaction(transactions[i], event, blockNumber),
      );
    }
    // updating all the transactions
    await Promise.all(updateTransactions);

    await addBlock(event, transactionCopy);
  };
  await network.addBlockListener(listener, {});
};
