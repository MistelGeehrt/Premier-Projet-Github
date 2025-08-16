const db = require('./db');
const bcrypt = require('bcrypt');

(async () => {
  const pass = await bcrypt.hash('pass',10);
  await db.createUser('Alice','610000001','alice@example.com',pass);
  await db.createUser('Bob','610000002','bob@example.com',pass);
  await db.createUser('Carol','610000003','carol@example.com',pass);
  await db.createAuction(1,'Téléphone', 'Smartphone utilisé', 5000, 4000, 8000, db.computeEndAt('24h'));
  await db.createAuction(2,'Chaussures', 'Neuves', 10000, 8000, null, db.computeEndAt('48h'));
  await db.createAuction(3,'Sac', 'En cuir', 7000, 6000, 12000, db.computeEndAt('72h'));
  await db.createAuction(1,'Montre', 'Belle montre', 15000, 12000, null, db.computeEndAt('7d'));
  await db.createAuction(2,'Casque', 'Casque audio', 3000, 2500, 5000, db.computeEndAt('24h'));
  console.log('Seed done');
})();
