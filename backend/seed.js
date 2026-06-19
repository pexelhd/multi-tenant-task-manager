const { sequelize, User } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();

    const [user, created] = await User.findOrCreate({
      where: { keycloakId: '004834c6-faeb-467b-9d75-0cce5ed7b52e' },
      defaults: {
        email: 'superadmin@test.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: null,
      },
    });

    if (created) {
      console.log('✅ Super Admin user seeded:', user.toJSON());
    } else {
      console.log('ℹ️ Super Admin user already exists:', user.toJSON());
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
