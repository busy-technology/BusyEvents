const mongoose = require('mongoose');
const config = require('./config');
const transactionListener = require('./transaction-events');
const contractListener = require('./contract-events');
const saveAdmin = require('./saveAdmin');
const InitializeSupply = require('./initializeTotalSupply');

mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.log(err);
});

db.once('open', async () => {
  // listen to the events
  await saveAdmin('admin');
  await saveAdmin('busy_network');
  await InitializeSupply();

  await Promise.all([contractListener(), transactionListener()]);
});
