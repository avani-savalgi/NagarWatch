// Run with: npm run seed:hash
// Prints bcrypt hashes for the demo password "Demo@12345" so you can paste
// real hashes into db/seed.sql before running it (the placeholders shipped
// in seed.sql are NOT valid bcrypt hashes and will not let you log in).
const bcrypt = require('bcryptjs');

const password = 'Demo@12345';
const hash = bcrypt.hashSync(password, 10);

console.log('\nDemo password:', password);
console.log('Bcrypt hash to paste into db/seed.sql:\n');
console.log(hash);
console.log('\nReplace all three PasswordHash placeholder values in seed.sql with this string.\n');
