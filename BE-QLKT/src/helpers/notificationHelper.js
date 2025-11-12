const { prisma } = require('../models');

class NotificationHelper {
  /**
   * Gửi thông báo khi Manager gửi đề xuất khen thưởng
   * -> Tất cả ADMIN nhận thông báo
   */
  async notifyAdminsOnProposalSubmission(proposal, submitter) {
    try {
      // Lấy tất cả tài khoản ADMIN
      const admins = await prisma.taiKhoan.findMany({
        where: {
          role: 'ADMIN',
        },
        select: {
          id: true,
          role: true,
        },
      });

      // Tạo thông báo cho từng admin
      const notifications = admins.map(admin => ({
        nguoi_nhan_id: admin.id,
        recipient_role: admin.role,
        type: 'PROPOSAL_SUBMITTED',
        title: 'Đề xuất khen thưởng mới',
        message: `${submitter.username} đã gửi đề xuất khen thưởng #${proposal.id}`,
        resource: 'proposals',
        tai_nguyen_id: null, // proposal.id là UUID, không thể lưu vào tai_nguyen_id (Int)
        link: `/admin/proposals/${proposal.id}`,
      }));

      if (notifications.length > 0) {
        await prisma.thongBao.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Error sending proposal submission notifications:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo khi Admin phê duyệt đề xuất
   * -> Chỉ người gửi đề xuất nhận thông báo
   */
  async notifyManagerOnProposalApproval(proposal, approver) {
    try {
      const notification = await prisma.thongBao.create({
        data: {
          nguoi_nhan_id: proposal.nguoi_de_xuat_id,
          recipient_role: 'MANAGER',
          type: 'PROPOSAL_APPROVED',
          title: 'Đề xuất đã được phê duyệt',
          message: `Đề xuất khen thưởng #${proposal.id} của bạn đã được ${approver.username} phê duyệt`,
          resource: 'proposals',
          tai_nguyen_id: null, // proposal.id là UUID, không thể lưu vào tai_nguyen_id (Int)
          link: `/manager/proposals/${proposal.id}`,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending proposal approval notification:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo khi Admin từ chối đề xuất
   * -> Chỉ người gửi đề xuất nhận thông báo
   */
  async notifyManagerOnProposalRejection(proposal, rejector, reason) {
    try {
      const notification = await prisma.thongBao.create({
        data: {
          nguoi_nhan_id: proposal.nguoi_de_xuat_id,
          recipient_role: 'MANAGER',
          type: 'PROPOSAL_REJECTED',
          title: 'Đề xuất bị từ chối',
          message: `Đề xuất khen thưởng #${proposal.id} của bạn đã bị từ chối. Lý do: ${reason}`,
          resource: 'proposals',
          tai_nguyen_id: null, // proposal.id là UUID, không thể lưu vào tai_nguyen_id (Int)
          link: `/manager/proposals/${proposal.id}`,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending proposal rejection notification:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo khi Admin thêm khen thưởng thành công
   * -> Tất cả MANAGER của đơn vị đó nhận thông báo
   */
  async notifyManagersOnAwardAdded(donViId, donViName, year, awardType, adminUsername) {
    try {
      // Lấy tất cả MANAGER của đơn vị
      const managers = await prisma.taiKhoan.findMany({
        where: {
          role: 'MANAGER',
          QuanNhan: {
            don_vi_id: donViId,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (managers.length === 0) {
        return 0;
      }

      // Tạo thông báo cho từng manager
      const notifications = managers.map(manager => ({
        nguoi_nhan_id: manager.id,
        recipient_role: manager.role,
        type: 'AWARD_ADDED',
        title: 'Khen thưởng mới đã được thêm',
        message: `${adminUsername} đã thêm danh sách khen thưởng ${awardType} năm ${year} cho đơn vị ${donViName}`,
        resource: 'awards',
        tai_nguyen_id: null, // donViId là UUID, không thể lưu vào tai_nguyen_id (Int)
        link: `/manager/awards?don_vi_id=${donViId}&nam=${year}`,
      }));

      await prisma.thongBao.createMany({
        data: notifications,
      });

      return notifications.length;
    } catch (error) {
      console.error('Error sending award added notifications:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo khi có quân nhân mới được thêm vào
   * -> MANAGER của đơn vị nhận thông báo
   */
  async notifyManagerOnPersonnelAdded(personnel, adminUsername) {
    try {
      // Lấy tất cả MANAGER của đơn vị
      const managers = await prisma.taiKhoan.findMany({
        where: {
          role: 'MANAGER',
          QuanNhan: {
            don_vi_id: personnel.don_vi_id,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (managers.length === 0) {
        return 0;
      }

      // Tạo thông báo cho từng manager
      const notifications = managers.map(manager => ({
        nguoi_nhan_id: manager.id,
        recipient_role: manager.role,
        type: 'PERSONNEL_ADDED',
        title: 'Quân nhân mới được thêm',
        message: `${adminUsername} đã thêm quân nhân mới: ${personnel.ho_ten} (CCCD: ${personnel.cccd})`,
        resource: 'personnel',
        tai_nguyen_id: null, // personnel.id là UUID, không thể lưu vào tai_nguyen_id (Int)
        link: `/manager/personnel/${personnel.id}`,
      }));

      await prisma.thongBao.createMany({
        data: notifications,
      });

      return notifications.length;
    } catch (error) {
      console.error('Error sending personnel added notifications:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo khi thành tích khoa học được phê duyệt
   * -> Quân nhân sở hữu thành tích nhận thông báo (nếu có tài khoản)
   */
  async notifyUserOnAchievementApproved(achievement, approverUsername) {
    try {
      // Lấy thông tin tài khoản của quân nhân
      const account = await prisma.taiKhoan.findFirst({
        where: {
          quan_nhan_id: achievement.quan_nhan_id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!account) {
        return null; // Quân nhân chưa có tài khoản
      }

      const notification = await prisma.thongBao.create({
        data: {
          nguoi_nhan_id: account.id,
          recipient_role: account.role,
          type: 'ACHIEVEMENT_APPROVED',
          title: 'Thành tích khoa học đã được phê duyệt',
          message: `Thành tích khoa học ${achievement.loai} năm ${achievement.nam} của bạn đã được ${approverUsername} phê duyệt`,
          resource: 'achievements',
          tai_nguyen_id: null, // achievement.id là UUID, không thể lưu vào tai_nguyen_id (Int)
          link: `/user/achievements`,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending achievement approval notification:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo hệ thống chung
   */
  async sendSystemNotification(recipients, type, title, message, resource = null, resourceId = null, link = null) {
    try {
      const notifications = recipients.map(recipient => ({
        nguoi_nhan_id: recipient.id,
        recipient_role: recipient.role,
        type,
        title,
        message,
        resource,
        tai_nguyen_id: typeof resourceId === 'number' ? resourceId : null, // Chỉ lưu nếu là Int
        link,
      }));

      if (notifications.length > 0) {
        await prisma.thongBao.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Error sending system notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationHelper();
