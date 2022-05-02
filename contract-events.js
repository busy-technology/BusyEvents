const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const balanceHandler = require('./balance-event');
const nftHandler = require('./nft-event');

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
  const busy = network.getContract('busy-chaincode');
  const listener = async (event) => {
    console.log('Received contract event for ', event.eventName);
    const payload = JSON.parse(event.payload.toString());
    if (event.eventName === 'BALANCE') {
      await balanceHandler(busy, payload);
    } else if (event.eventName === 'NFT') {
      await nftHandler(busy, payload);
    }
  };
  await busy.addContractListener(listener, {});
};
