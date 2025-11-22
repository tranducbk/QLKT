const { Sequelize } = require('sequelize');

// Khởi tạo Sequelize từ DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    timezone: '+07:00',
  },
  timezone: '+07:00',
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Sequelize: Kết nối database thành công!');
  } catch (error) {
    console.error('✗ Sequelize: Không thể kết nối database:', error.message);
  }
};

testConnection();

module.exports = sequelize;
