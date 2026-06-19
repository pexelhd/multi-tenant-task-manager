const { sequelize } = require('./models');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    return sequelize.sync({ force: true });
  })
  .then(() => {
    console.log('✅ All models synced (tables created)');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
