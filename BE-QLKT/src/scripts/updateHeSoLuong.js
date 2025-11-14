const { prisma } = require('../models');

async function updateHeSoLuong() {
  try {
    const result = await prisma.$executeRaw`
      UPDATE lich_su_chuc_vu
      SET he_so_luong = 0
      WHERE he_so_luong IS NULL;
    `;
    console.log(`✅ Updated ${result} records`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHeSoLuong();

