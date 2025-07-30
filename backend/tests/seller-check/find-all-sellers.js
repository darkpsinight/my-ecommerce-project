const mongoose = require('mongoose');
const { User } = require('../../models/user');

mongoose.connect(process.env.MONGO_URI);

setTimeout(async () => {
  try {
    const sellers = await User.find({ roles: 'seller' });
    console.log('All sellers in database:');
    sellers.forEach((seller, i) => {
      console.log(`${i+1}. Email: ${seller.email}, UID: ${seller.uid}`);
    });
    
    // Also check users without seller role but might be sellers
    const allUsers = await User.find({}).select('email uid roles');
    console.log('\nAll users (to find your account):');
    allUsers.forEach((user, i) => {
      console.log(`${i+1}. Email: ${user.email}, UID: ${user.uid}, Roles: ${user.roles}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}, 1000);