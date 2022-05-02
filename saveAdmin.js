const { Wallets } = require('fabric-network');
const path = require('path');
const Admin = require('./models/admin');
const Decrypt = require('./decrypt');
const config = require('./config');

module.exports = async (adminUserId) => {
  try {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'network', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminUserId);
    const adminData = await Admin.findOne({ userId: adminUserId });

    if (identity) {
      console.log(`${adminUserId} User Already Exists`);
    } else if (adminData) {
      console.log(`${adminUserId} is put into the wallet from the DB`);

      const credentials = {
        certificate: Decrypt(
          adminData.certificate.credentials.certificate,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
        privateKey: Decrypt(
          adminData.certificate.credentials.privateKey,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
      };

      const blockchainCredentials = {
        credentials,
        mspId: adminData.certificate.mspId,
        type: adminData.certificate.type,
      };

      await wallet.put(adminUserId, blockchainCredentials);
    } else {
      console.error(`${adminUserId} User not found in the DB`);
    }
    return adminData;
  } catch (exception) {
    return exception;
  }
};
