import axiosInstance from '@/utils/axiosInstance';

type ApiResponse<T = any> = { success: boolean; data?: T; message?: string };

export const apiClient = {
  // Auth
  async login(username: string, password: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });
      return {
        success: true,
        data: res.data?.data || res.data,
        message: res.data?.message,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.message || e?.response?.data?.error || e.message,
      };
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Accounts
  async getAccounts(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/accounts', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getAccountById(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/accounts/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updateAccount(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/accounts/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createAccount(body: {
    username: string;
    password: string;
    role: string;
    don_vi_id?: string;
    chuc_vu_id?: string;
    personnel_id?: string;
  }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/accounts', body);
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      console.error('API createAccount error:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra khi tạo tài khoản';
      return { success: false, message: errorMessage };
    }
  },

  async deleteAccount(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/accounts/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async resetAccountPassword(accountId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/accounts/reset-password', {
        account_id: Number(accountId),
      });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Personnel
  async getPersonnel(params?: {
    page?: number;
    limit?: number;
    search?: string;
    unit_id?: number;
  }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/personnel', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getPersonnelById(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/personnel/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createPersonnel(body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/personnel', body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updatePersonnel(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/personnel/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deletePersonnel(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/personnel/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // System logs
  async getSystemLogs(params?: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/system-logs', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Units
  async getUnits(params?: { hierarchy?: boolean }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/units', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getUnitById(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/units/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createUnit(body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/units', body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updateUnit(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/units/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deleteUnit(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/units/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Positions
  async getPositions(params?: { unit_id?: number; include_children?: boolean }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/positions', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createPosition(body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/positions', body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updatePosition(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/positions/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deletePosition(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/positions/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Annual Rewards
  async getAnnualRewards(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/personnel/${personnelId}/annual-rewards`);
      return { success: true, data: res.data?.data?.rewards || res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createAnnualReward(personnelId: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(`/api/personnel/${personnelId}/annual-rewards`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updateAnnualReward(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/annual-rewards/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deleteAnnualReward(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/annual-rewards/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async bulkCreateAnnualRewards(body: {
    personnel_ids: number[];
    nam: number;
    danh_hieu: string;
    so_quyet_dinh?: string;
    file_quyet_dinh?: File;
  }): Promise<ApiResponse> {
    try {
      // Nếu có file, gửi dưới dạng FormData
      if (body.file_quyet_dinh) {
        const formData = new FormData();
        formData.append('personnel_ids', JSON.stringify(body.personnel_ids));
        formData.append('nam', body.nam.toString());
        formData.append('danh_hieu', body.danh_hieu);
        if (body.so_quyet_dinh) {
          formData.append('so_quyet_dinh', body.so_quyet_dinh);
        }
        formData.append('file_quyet_dinh', body.file_quyet_dinh);

        const res = await axiosInstance.post('/api/annual-rewards/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true, data: res.data?.data || res.data, message: res.data?.message };
      }

      // Nếu không có file, gửi dưới dạng JSON
      const res = await axiosInstance.post('/api/annual-rewards/bulk', body);
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Position History
  async getPositionHistory(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/personnel/${personnelId}/position-history`);
      return { success: true, data: res.data?.data?.history || res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createPositionHistory(personnelId: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(`/api/personnel/${personnelId}/position-history`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updatePositionHistory(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/position-history/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deletePositionHistory(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/position-history/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Scientific Achievements
  async getScientificAchievements(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/personnel/${personnelId}/scientific-achievements`);
      return { success: true, data: res.data?.data?.achievements || res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async createScientificAchievement(personnelId: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(
        `/api/personnel/${personnelId}/scientific-achievements`,
        body
      );
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updateScientificAchievement(id: string, body: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/scientific-achievements/${id}`, body);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deleteScientificAchievement(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/scientific-achievements/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Personnel Export/Import
  async exportPersonnel(): Promise<Blob> {
    try {
      const res = await axiosInstance.get('/api/personnel/export', {
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  async exportPersonnelSample(): Promise<Blob> {
    try {
      const res = await axiosInstance.get('/api/personnel/export-sample', {
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  async importPersonnel(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post('/api/personnel/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Proposals
  async getProposalTemplate(type: 'HANG_NAM' | 'NIEN_HAN' = 'HANG_NAM'): Promise<Blob> {
    try {
      const res = await axiosInstance.get('/api/proposals/template', {
        params: { type },
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  async submitProposal(formData: FormData): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/proposals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getProposals(params?: { page?: number; limit?: number }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/proposals', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getProposalById(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/proposals/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async approveProposal(id: string, formData: FormData): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(`/api/proposals/${id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async rejectProposal(id: string, ghi_chu: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(`/api/proposals/${id}/reject`, { ghi_chu });
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async downloadProposalExcel(id: string): Promise<Blob> {
    try {
      const res = await axiosInstance.get(`/api/proposals/${id}/download-excel`, {
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  async deleteProposal(id: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/proposals/${id}`);
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Awards Management
  async getAwards(params?: {
    don_vi_id?: number;
    nam?: number;
    danh_hieu?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/awards', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getAwardsTemplate(): Promise<Blob> {
    try {
      const res = await axiosInstance.get('/api/awards/template', {
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  async importAwards(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post('/api/awards/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async exportAwards(params?: {
    don_vi_id?: number;
    nam?: number;
    danh_hieu?: string;
  }): Promise<Blob> {
    try {
      const res = await axiosInstance.get('/api/awards/export', {
        params,
        responseType: 'blob',
      });
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || e.message);
    }
  },

  // Notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/notifications', { params });
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getUnreadNotificationCount(): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/notifications/unread-count');
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async markNotificationAsRead(id: number): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.patch(`/api/notifications/${id}/read`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.patch('/api/notifications/read-all');
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async deleteNotification(id: number): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.delete(`/api/notifications/${id}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  // Profiles
  async getAnnualProfile(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/profiles/annual/${personnelId}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getServiceProfile(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get(`/api/profiles/service/${personnelId}`);
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async recalculateProfile(personnelId: string): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post(`/api/profiles/recalculate/${personnelId}`);
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async recalculateAllProfiles(): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.post('/api/profiles/recalculate-all');
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async getAllServiceProfiles(): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.get('/api/profiles/service');
      return { success: true, data: res.data?.data || res.data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  async updateServiceProfile(personnelId: string, updates: any): Promise<ApiResponse> {
    try {
      const res = await axiosInstance.put(`/api/profiles/service/${personnelId}`, updates);
      return { success: true, data: res.data?.data || res.data, message: res.data?.message };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },
};

export default apiClient;
