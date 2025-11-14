const { prisma } = require('../models');

async function deleteAllAccounts() {
  try {
    // Xóa tất cả tài khoản (cascade sẽ tự động xóa các bản ghi liên quan)
    const result = await prisma.taiKhoan.deleteMany({});
    console.log(`✅ Đã xóa ${result.count} tài khoản`);
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAccounts();

