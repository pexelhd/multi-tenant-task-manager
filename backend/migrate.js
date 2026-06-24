const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { sequelize } = require('./models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Add priority column to tasks if it doesn't exist
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'tasks' AND column_name = 'priority'
        ) THEN
          ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM';
          RAISE NOTICE 'Added priority column';
        ELSE
          RAISE NOTICE 'priority column already exists';
        END IF;
      END
      $$;
    `);

    // Ensure the ENUM type exists and the column uses it
    // (Sequelize ENUM creates a type named enum_tasks_priority)
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tasks_priority') THEN
          CREATE TYPE enum_tasks_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
        END IF;
      END
      $$;
    `);

    await sequelize.query(`
      ALTER TABLE tasks
        ALTER COLUMN priority TYPE enum_tasks_priority
        USING priority::enum_tasks_priority;
    `).catch(() => {
      // Already the right type — ignore
    });

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
