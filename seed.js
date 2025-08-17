const db = require('./src/db');
const { createAuction } = require('./src/auctions');

async function seed() {
  try {
    // Clear existing data
    await db.query('DELETE FROM bids');
    await db.query('DELETE FROM auctions');
    await db.query('DELETE FROM users');

    // Users
    const users = await Promise.all([
      db.query("INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id", ['alice', 'alice@example.com']),
      db.query("INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id", ['bob', 'bob@example.com']),
      db.query("INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id", ['carol', 'carol@example.com'])
    ]);
    const [alice, bob, carol] = users.map(r => r.rows[0].id);

    const now = new Date();
    const auctions = [];
    auctions.push(await createAuction({
      title: 'Vintage Phone',
      description: 'Old but gold',
      user_id: alice,
      category: 'electronics',
      image_url: 'https://example.com/phone.jpg',
      start_at: now,
      end_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      reserve_price: 100,
      buy_now_price: 200
    }));
    auctions.push(await createAuction({
      title: 'Classic Book',
      description: 'A timeless read',
      user_id: bob,
      category: 'books',
      image_url: 'https://example.com/book.jpg',
      start_at: now,
      end_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      reserve_price: 50,
      buy_now_price: null
    }));
    auctions.push(await createAuction({
      title: 'Designer Shirt',
      description: 'Fashion statement',
      user_id: carol,
      category: 'fashion',
      image_url: 'https://example.com/shirt.jpg',
      start_at: now,
      end_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      reserve_price: null,
      buy_now_price: 150
    }));
    auctions.push(await createAuction({
      title: 'Rare Coin',
      description: 'Collector\'s item',
      user_id: alice,
      category: 'collectibles',
      image_url: 'https://example.com/coin.jpg',
      start_at: now,
      end_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      reserve_price: 300,
      buy_now_price: 500
    }));
    auctions.push(await createAuction({
      title: 'Gaming Console',
      description: 'Next-gen console',
      user_id: bob,
      category: 'gaming',
      image_url: 'https://example.com/console.jpg',
      start_at: now,
      end_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      reserve_price: null,
      buy_now_price: 400
    }));

    // Bids
    await db.query("INSERT INTO bids (auction_id, user_id, amount, created_at) VALUES ($1,$2,$3,NOW())", [auctions[0].id, bob, 120]);
    await db.query("INSERT INTO bids (auction_id, user_id, amount, created_at) VALUES ($1,$2,$3,NOW())", [auctions[0].id, carol, 130]);
    await db.query("INSERT INTO bids (auction_id, user_id, amount, created_at) VALUES ($1,$2,$3,NOW())", [auctions[1].id, carol, 60]);
    await db.query("INSERT INTO bids (auction_id, user_id, amount, created_at) VALUES ($1,$2,$3,NOW())", [auctions[2].id, alice, 140]);
    await db.query("INSERT INTO bids (auction_id, user_id, amount, created_at) VALUES ($1,$2,$3,NOW())", [auctions[3].id, bob, 350]);

    console.log('Seed data inserted');
  } catch (err) {
    console.error('Error seeding database', err);
  } finally {
    process.exit();
  }
}

seed();
