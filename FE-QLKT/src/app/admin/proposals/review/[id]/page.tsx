'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Table,
  Alert,
  Typography,
  Breadcrumb,
  Space,
  Spin,
  Empty,
  Modal,
  Input,
  Tag,
  message,
  Select,
} from 'antd';
import {
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  BookOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { EditableCell } from '@/components/EditableCell';
import DecisionModal from '@/components/DecisionModal';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import axiosInstance from '@/utils/axiosInstance';

const { Title, Paragraph, Text } = Typography;

interface DanhHieuItem {
  personnel_id?: string;
  don_vi_id?: string;
  don_vi_type?: 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC';
  ho_ten?: string;
  ten_don_vi?: string;
  ma_don_vi?: string;
  nam: number;
  danh_hieu: string | null;
  cap_bac?: string | null;
  chuc_vu?: string | null;
  so_quyet_dinh?: string | null;
  nhan_bkbqp?: boolean;
  so_quyet_dinh_bkbqp?: string | null;
  nhan_cstdtq?: boolean;
  so_quyet_dinh_cstdtq?: string | null;
  file_quyet_dinh?: string | null;
  file_quyet_dinh_bkbqp?: string | null;
  file_quyet_dinh_cstdtq?: string | null;
  co_quan_don_vi?: {
    id: string;
    ten_co_quan_don_vi: string;
    ma_co_quan_don_vi: string;
  } | null;
  don_vi_truc_thuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    co_quan_don_vi?: {
      id: string;
      ten_don_vi_truc: string;
      ma_don_vi: string;
    } | null;
  } | null;
  co_quan_don_vi_cha?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
  } | null;
}

interface ThanhTichItem {
  personnel_id: string;
  ho_ten: string;
  nam: number;
  loai: string;
  mo_ta: string;
  status: string;
  so_quyet_dinh?: string;
  file_quyet_dinh?: string | null;
  cap_bac?: string | null;
  chuc_vu?: string | null;
  co_quan_don_vi?: {
    id: string;
    ten_co_quan_don_vi: string;
    ma_co_quan_don_vi: string;
  } | null;
  don_vi_truc_thuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    co_quan_don_vi?: {
      id: string;
      ten_don_vi_truc: string;
      ma_don_vi: string;
    } | null;
  } | null;
}

interface ProposalDetail {
  id: number;
  loai_de_xuat: string;
  don_vi: {
    id: number;
    ma_don_vi: string;
    ten_don_vi: string;
  };
  nguoi_de_xuat: {
    id: number;
    username: string;
    ho_ten: string;
  };
  status: string;
  data_danh_hieu: DanhHieuItem[];
  data_thanh_tich: ThanhTichItem[];
  data_nien_han: any[];
  data_cong_hien: any[];
  files_attached?: Array<{
    filename: string;
    originalName: string;
    size?: number;
    uploadedAt?: string;
  }>;
  ghi_chu: string | null;
  nguoi_duyet: any;
  ngay_duyet: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [editedDanhHieu, setEditedDanhHieu] = useState<DanhHieuItem[]>([]);
  const [editedThanhTich, setEditedThanhTich] = useState<ThanhTichItem[]>([]);
  const [editedNienHan, setEditedNienHan] = useState<any[]>([]);
  const [editedCongHien, setEditedCongHien] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionHistoriesMap, setPositionHistoriesMap] = useState<Record<string, any[]>>({});
  const [personnelDetails, setPersonnelDetails] = useState<Record<string, any>>({});
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [messageAlert, setMessageAlert] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Selection states for Danh Hieu
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Selection states for Thanh Tich
  const [selectedThanhTichKeys, setSelectedThanhTichKeys] = useState<React.Key[]>([]);

  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionModalType, setDecisionModalType] = useState<'danh_hieu' | 'thanh_tich'>(
    'danh_hieu'
  );

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [ghiChu, setGhiChu] = useState('');

  useEffect(() => {
    if (id) {
      fetchProposalDetail();
    }
  }, [id]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProposalById(String(id));

      if (res.success && res.data) {
        // Parse files_attached nếu cần
        const filesAttached = res.data.files_attached;
        const parsedFilesAttached = Array.isArray(filesAttached)
          ? filesAttached
          : filesAttached && typeof filesAttached === 'string'
          ? JSON.parse(filesAttached)
          : [];

        setProposal({
          ...res.data,
          files_attached: parsedFilesAttached,
        });
        const danhHieuData = res.data.data_danh_hieu;
        const thanhTichData = res.data.data_thanh_tich;
        const nienHanData = res.data.data_nien_han;
        const congHienData = res.data.data_cong_hien;

        const parsedDanhHieu = Array.isArray(danhHieuData)
          ? danhHieuData
          : danhHieuData && typeof danhHieuData === 'string'
          ? JSON.parse(danhHieuData)
          : [];

        const parsedThanhTich = Array.isArray(thanhTichData)
          ? thanhTichData
          : thanhTichData && typeof thanhTichData === 'string'
          ? JSON.parse(thanhTichData)
          : [];

        const parsedNienHan = Array.isArray(nienHanData)
          ? nienHanData
          : nienHanData && typeof nienHanData === 'string'
          ? JSON.parse(nienHanData)
          : [];

        const parsedCongHien = Array.isArray(congHienData)
          ? congHienData
          : congHienData && typeof congHienData === 'string'
          ? JSON.parse(congHienData)
          : [];

        setEditedDanhHieu(parsedDanhHieu);
        setEditedThanhTich(parsedThanhTich);
        setEditedNienHan(parsedNienHan);
        setEditedCongHien(parsedCongHien);

        // Fetch thông tin personnel để lấy chức vụ hiện tại
        // Với các loại đề xuất khác nhau, dữ liệu có thể nằm ở các field khác nhau
        const personnelData =
          parsedDanhHieu.length > 0
            ? parsedDanhHieu
            : parsedNienHan.length > 0
            ? parsedNienHan
            : parsedCongHien.length > 0
            ? parsedCongHien
            : [];

        if (personnelData.length > 0) {
          await fetchPersonnelDetails(personnelData);
        }

        // Nếu là đề xuất cống hiến, fetch lịch sử chức vụ cho tất cả quân nhân
        if (res.data.loai_de_xuat === 'CONG_HIEN' && parsedCongHien.length > 0) {
          await fetchPositionHistories(parsedCongHien);
        }
      } else {
        setMessageAlert({ type: 'error', text: res.message || 'Không tải được đề xuất' });
      }
    } catch (error: any) {
      setMessageAlert({ type: 'error', text: error.message || 'Lỗi khi tải đề xuất' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnelDetails = async (danhHieuItems: DanhHieuItem[]) => {
    try {
      const detailsMap: Record<string, any> = {};

      // Fetch thông tin personnel cho mỗi quân nhân
      await Promise.all(
        danhHieuItems.map(async item => {
          if (item.personnel_id) {
            try {
              const res = await apiClient.getPersonnelById(item.personnel_id);
              if (res.success && res.data) {
                detailsMap[item.personnel_id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
            }
          }
        })
      );

      setPersonnelDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching personnel details:', error);
    }
  };

  const fetchPositionHistories = async (danhHieuItems: DanhHieuItem[]) => {
    try {
      const historiesMap: Record<string, any[]> = {};

      // Fetch lịch sử chức vụ cho mỗi quân nhân
      await Promise.all(
        danhHieuItems.map(async item => {
          if (item.personnel_id) {
            try {
              const res = await apiClient.getPositionHistory(item.personnel_id);
              if (res.success && res.data) {
                historiesMap[item.personnel_id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
              historiesMap[item.personnel_id] = [];
            }
          }
        })
      );

      setPositionHistoriesMap(historiesMap);
    } catch (error) {
      console.error('Error fetching position histories:', error);
    }
  };

  // Tính tổng thời gian đảm nhiệm chức vụ theo nhóm hệ số cho một quân nhân
  const calculateTotalTimeByGroup = (personnelId: string, group: '0.7' | '0.8' | '0.9-1.0') => {
    const histories = positionHistoriesMap[personnelId] || [];
    let totalMonths = 0;

    histories.forEach((history: any) => {
      const heSo = Number(history.he_so_chuc_vu) || 0;
      let belongsToGroup = false;

      if (group === '0.7') {
        belongsToGroup = heSo >= 0.7 && heSo < 0.8;
      } else if (group === '0.8') {
        belongsToGroup = heSo >= 0.8 && heSo < 0.9;
      } else if (group === '0.9-1.0') {
        belongsToGroup = heSo >= 0.9 && heSo <= 1.0;
      }

      if (belongsToGroup && history.so_thang !== null && history.so_thang !== undefined) {
        totalMonths += history.so_thang;
      }
    });

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (totalMonths === 0) return '-';
    if (years > 0 && remainingMonths > 0) {
      return `${years} năm ${remainingMonths} tháng`;
    } else if (years > 0) {
      return `${years} năm`;
    } else {
      return `${remainingMonths} tháng`;
    }
  };

  const handleReject = async () => {
    if (!ghiChu.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setRejecting(true);
      setMessageAlert(null);

      const response = await apiClient.rejectProposal(String(id), ghiChu);

      if (response.success) {
        message.success('Đã từ chối đề xuất thành công');
        setRejectModalVisible(false);
        await fetchProposalDetail();

        setTimeout(() => {
          router.push('/admin/proposals/review');
        }, 2000);
      } else {
        setMessageAlert({ type: 'error', text: response.message || 'Lỗi khi từ chối đề xuất' });
      }
    } catch (error: any) {
      setMessageAlert({ type: 'error', text: error.message || 'Lỗi khi từ chối đề xuất' });
    } finally {
      setRejecting(false);
    }
  };

  const handleApprove = async () => {
    // Kiểm tra tất cả danh hiệu/thành tích đã có số quyết định chưa
    let missingDecisions: string[] = [];

    // Kiểm tra danh hiệu hằng năm (CA_NHAN_HANG_NAM, DON_VI_HANG_NAM)
    if (editedDanhHieu.length > 0) {
      editedDanhHieu.forEach((item, index) => {
        if (proposal.loai_de_xuat === 'DON_VI_HANG_NAM') {
          // Với đề xuất đơn vị hằng năm, kiểm tra so_quyet_dinh
          if (!item.so_quyet_dinh || item.so_quyet_dinh.trim() === '') {
            missingDecisions.push(`Đơn vị ${index + 1}: ${item.ten_don_vi || 'N/A'}`);
          }
        } else {
          // Với đề xuất cá nhân, kiểm tra so_quyet_dinh (bắt buộc)
          if (!item.so_quyet_dinh || item.so_quyet_dinh.trim() === '') {
            missingDecisions.push(`Quân nhân ${index + 1}: ${item.ho_ten || 'N/A'}`);
          }
        }
      });
    }

    // Kiểm tra thành tích khoa học (NCKH)
    if (editedThanhTich.length > 0) {
      editedThanhTich.forEach((item, index) => {
        if (!item.so_quyet_dinh || item.so_quyet_dinh.trim() === '') {
          missingDecisions.push(`Thành tích ${index + 1}: ${item.ho_ten || 'N/A'}`);
        }
      });
    }

    // Kiểm tra niên hạn (NIEN_HAN, HC_QKQT, KNC_VSNXD_QDNDVN)
    if (editedNienHan.length > 0) {
      editedNienHan.forEach((item, index) => {
        if (!item.so_quyet_dinh || item.so_quyet_dinh.trim() === '') {
          missingDecisions.push(`Niên hạn ${index + 1}: ${item.ho_ten || 'N/A'}`);
        }
      });
    }

    // Kiểm tra cống hiến (CONG_HIEN)
    if (editedCongHien.length > 0) {
      editedCongHien.forEach((item, index) => {
        if (!item.so_quyet_dinh || item.so_quyet_dinh.trim() === '') {
          missingDecisions.push(`Cống hiến ${index + 1}: ${item.ho_ten || 'N/A'}`);
        }
      });
    }

    // Nếu thiếu số quyết định, hiển thị cảnh báo
    if (missingDecisions.length > 0) {
      Modal.warning({
        title: 'Thiếu số quyết định',
        content: (
          <div>
            <p style={{ marginBottom: 12 }}>
              Vui lòng thêm số quyết định cho tất cả các mục trước khi phê duyệt:
            </p>
            <ul style={{ marginLeft: 20, marginBottom: 0 }}>
              {missingDecisions.slice(0, 10).map((item, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
              {missingDecisions.length > 10 && (
                <li>... và {missingDecisions.length - 10} mục khác</li>
              )}
            </ul>
          </div>
        ),
        okText: 'Đã hiểu',
        width: 600,
        centered: true,
      });
      return;
    }

    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn phê duyệt đề xuất này? Dữ liệu sẽ được import vào hệ thống.</p>
          <p style={{ marginTop: 12, color: '#666' }}>
            Tất cả các mục đã có số quyết định. Sau khi phê duyệt, dữ liệu sẽ được import vào hệ
            thống.
          </p>
        </div>
      ),
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      closable: true,
      centered: true,
      width: 500,
      style: { borderRadius: 8 },
      styles: { body: { borderRadius: 8 } },
      onOk: async () => {
        try {
          setApproving(true);
          setMessageAlert(null);

          const formData = new FormData();
          formData.append('data_danh_hieu', JSON.stringify(editedDanhHieu));
          formData.append('data_thanh_tich', JSON.stringify(editedThanhTich));
          formData.append('data_nien_han', JSON.stringify(editedNienHan));
          formData.append('data_cong_hien', JSON.stringify(editedCongHien));

          const response = await apiClient.approveProposal(String(id), formData);

          if (response.success) {
            const importedData = response.data || {};
            const importedDanhHieu = importedData.imported_danh_hieu || 0;
            const totalDanhHieu = importedData.total_danh_hieu || 0;
            const importedThanhTich = importedData.imported_thanh_tich || 0;
            const totalThanhTich = importedData.total_thanh_tich || 0;
            const importedNienHan = importedData.imported_nien_han || 0;
            const totalNienHan = importedData.total_nien_han || 0;

            // Tạo thông báo dựa trên loại đề xuất
            let successMessage = 'Đã phê duyệt đề xuất thành công. ';
            const loaiDeXuat = proposal?.loai_de_xuat;

            if (
              loaiDeXuat === 'NIEN_HAN' ||
              loaiDeXuat === 'HC_QKQT' ||
              loaiDeXuat === 'KNC_VSNXD_QDNDVN'
            ) {
              successMessage += `Import ${importedNienHan}/${totalNienHan} niên hạn.`;
            } else if (loaiDeXuat === 'CONG_HIEN') {
              successMessage += `Import ${importedDanhHieu}/${totalDanhHieu} cống hiến.`;
            } else if (loaiDeXuat === 'NCKH') {
              successMessage += `Import ${importedThanhTich}/${totalThanhTich} thành tích khoa học.`;
            } else if (loaiDeXuat === 'DON_VI_HANG_NAM') {
              successMessage += `Import ${importedDanhHieu}/${totalDanhHieu} danh hiệu đơn vị.`;
            } else {
              // CA_NHAN_HANG_NAM hoặc các loại khác
              if (importedDanhHieu > 0 && importedThanhTich > 0) {
                successMessage += `Import ${importedDanhHieu}/${totalDanhHieu} danh hiệu và ${importedThanhTich}/${totalThanhTich} thành tích.`;
              } else if (importedDanhHieu > 0) {
                successMessage += `Import ${importedDanhHieu}/${totalDanhHieu} danh hiệu.`;
              } else if (importedThanhTich > 0) {
                successMessage += `Import ${importedThanhTich}/${totalThanhTich} thành tích.`;
              }
            }

            // Hiển thị thông báo thành công hoặc cảnh báo
            if (importedData.errors && importedData.errors.length > 0) {
              message.warning(`${successMessage} Có ${importedData.errors.length} lỗi xảy ra.`, 5);
              // Hiển thị errors chi tiết
              setMessageAlert({
                type: 'error',
                text: `Có ${importedData.errors.length} lỗi khi import:\n${importedData.errors
                  .slice(0, 5)
                  .join('\n')}${importedData.errors.length > 5 ? '\n...' : ''}`,
              });
            } else {
              message.success(successMessage);
            }

            // Refresh data
            await fetchProposalDetail();
          } else {
            setMessageAlert({
              type: 'error',
              text: response.message || 'Lỗi khi phê duyệt đề xuất',
            });
          }
        } catch (error: any) {
          setMessageAlert({ type: 'error', text: error.message || 'Lỗi khi phê duyệt đề xuất' });
        } finally {
          setApproving(false);
        }
      },
    });
  };

  const handleDecisionSuccess = (decision: any) => {
    if (decisionModalType === 'danh_hieu') {
      // Xác định loại đề xuất để cập nhật đúng state
      const loaiDeXuat = proposal?.loai_de_xuat;

      // Hàm helper để áp dụng quyết định cho một item
      const applyDecision = (item: any, index: number) => {
        if (!selectedRowKeys.includes(index)) return item;

        // Xác định loại quyết định dựa trên loai_khen_thuong hoặc số quyết định
        const loaiKhenThuong = decision.loai_khen_thuong || '';
        const soQuyetDinh = decision.so_quyet_dinh || '';

        // Kiểm tra nếu là quyết định BKBQP hoặc CSTDTQ (chỉ áp dụng cho CA_NHAN_HANG_NAM)
        if (loaiDeXuat === 'CA_NHAN_HANG_NAM') {
          const isBKBQP =
            loaiKhenThuong.includes('BKBQP') ||
            soQuyetDinh.toLowerCase().includes('bkbqp') ||
            soQuyetDinh.toLowerCase().includes('bằng khen');
          const isCSTDTQ =
            loaiKhenThuong.includes('CSTDTQ') ||
            soQuyetDinh.toLowerCase().includes('cstdtq') ||
            soQuyetDinh.toLowerCase().includes('chiến sĩ thi đua toàn quân');

          // Nếu là quyết định BKBQP hoặc CSTDTQ, lưu vào trường tương ứng
          if (isBKBQP) {
            return {
              ...item,
              nhan_bkbqp: true,
              so_quyet_dinh_bkbqp: decision.so_quyet_dinh,
              file_quyet_dinh_bkbqp: decision.file_path || null,
              so_quyet_dinh: item.so_quyet_dinh || null,
              file_quyet_dinh: item.file_quyet_dinh || null,
            };
          } else if (isCSTDTQ) {
            return {
              ...item,
              nhan_cstdtq: true,
              so_quyet_dinh_cstdtq: decision.so_quyet_dinh,
              file_quyet_dinh_cstdtq: decision.file_path || null,
              so_quyet_dinh: item.so_quyet_dinh || null,
              file_quyet_dinh: item.file_quyet_dinh || null,
            };
          }
        }

        // Quyết định thông thường - áp dụng cho tất cả loại
        return {
          ...item,
          so_quyet_dinh: decision.so_quyet_dinh,
          file_quyet_dinh: decision.file_path || null,
        };
      };

      // Cập nhật state tương ứng với loại đề xuất
      if (
        loaiDeXuat === 'NIEN_HAN' ||
        loaiDeXuat === 'HC_QKQT' ||
        loaiDeXuat === 'KNC_VSNXD_QDNDVN'
      ) {
        const updatedNienHan = editedNienHan.map(applyDecision);
        setEditedNienHan(updatedNienHan);
      } else if (loaiDeXuat === 'CONG_HIEN') {
        const updatedCongHien = editedCongHien.map(applyDecision);
        setEditedCongHien(updatedCongHien);
      } else {
        const updatedDanhHieu = editedDanhHieu.map(applyDecision);
        setEditedDanhHieu(updatedDanhHieu);
      }

      const count = selectedRowKeys.length;
      setSelectedRowKeys([]);
      message.success(
        `Đã áp dụng số quyết định cho ${count} ${
          loaiDeXuat === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'người'
        }`
      );
    } else {
      // Apply decision to selected thanh tich
      const updatedThanhTich = editedThanhTich.map((item, index) => {
        if (selectedThanhTichKeys.includes(index)) {
          return {
            ...item,
            so_quyet_dinh: decision.so_quyet_dinh,
            file_quyet_dinh: decision.file_path || null,
          };
        }
        return item;
      });

      setEditedThanhTich(updatedThanhTich);
      setSelectedThanhTichKeys([]);
      message.success(`Đã áp dụng số quyết định cho ${selectedThanhTichKeys.length} thành tích`);
    }
  };

  const updateDanhHieu = (index: number, field: keyof DanhHieuItem, value: any) => {
    const newData = [...editedDanhHieu];
    newData[index] = { ...newData[index], [field]: value };
    setEditedDanhHieu(newData);
  };

  const updateThanhTich = (index: number, field: keyof ThanhTichItem, value: any) => {
    const newData = [...editedThanhTich];
    newData[index] = { ...newData[index], [field]: value };
    setEditedThanhTich(newData);
  };

  const updateNienHan = (index: number, field: string, value: any) => {
    const newData = [...editedNienHan];
    newData[index] = { ...newData[index], [field]: value };
    setEditedNienHan(newData);
  };

  const updateCongHien = (index: number, field: string, value: any) => {
    const newData = [...editedCongHien];
    newData[index] = { ...newData[index], [field]: value };
    setEditedCongHien(newData);
  };

  // Hàm để tải file quyết định
  const handleOpenDecisionFile = async (soQuyetDinh: string, filePath?: string | null) => {
    try {
      let filename: string | null = null;

      // Nếu đã có file_path trong record, dùng luôn
      if (filePath) {
        filename = filePath.split('/').pop() || null;
      } else {
        // Nếu chưa có file_path, tìm từ DB dựa trên số quyết định
        const response = await apiClient.getDecisionBySoQuyetDinh(soQuyetDinh);
        if (response.success && response.data?.file_path) {
          filename = response.data.file_path.split('/').pop() || null;
        }
      }

      if (filename) {
        // Tải file về bằng axios với responseType: 'blob'
        const response = await axiosInstance.get(`/api/proposals/uploads/${filename}`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${soQuyetDinh}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('Tải file thành công');
      } else {
        message.warning('Không tìm thấy file quyết định');
      }
    } catch (error: any) {
      console.error('Error downloading decision file:', error);
      message.error('Lỗi khi tải file quyết định');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Space>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <span style={{ color: '#666' }}>Đang tải...</span>
        </Space>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Không tìm thấy đề xuất"
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
        />
      </div>
    );
  }

  // ============================================
  // COLUMNS CHO TỪNG LOẠI ĐỀ XUẤT
  // ============================================

  // Columns cho CA_NHAN_HANG_NAM (Cá nhân Hằng năm)
  const caNhanHangNamColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 250,
      align: 'center' as const,
      render: (text: string, record: DanhHieuItem) => {
        const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
        const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
        const parts = [];
        if (donViTrucThuoc) parts.push(donViTrucThuoc);
        if (coQuanDonVi) parts.push(coQuanDonVi);
        const unitInfo = parts.length > 0 ? parts.join(', ') : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong>{text}</Text>
            {unitInfo && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                {unitInfo}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cấp bậc / Chức vụ',
      key: 'cap_bac_chuc_vu',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: DanhHieuItem) => {
        // Chỉ hiển thị nếu có dữ liệu trong dataJSON
        const capBac = record.cap_bac;
        const chucVu = record.chuc_vu;

        // Nếu không có cả cấp bậc và chức vụ, để trống
        if (!capBac && !chucVu) {
          return <span>-</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {capBac && <Text strong>{capBac}</Text>}
            {chucVu && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: capBac ? '4px' : '0' }}>
                {chucVu}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.nam}
          type="number"
          onSave={val => updateDanhHieu(index, 'nam', parseInt(val))}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 250,
      render: (_: any, record: DanhHieuItem, index: number) => {
        // Map mã danh hiệu sang tên đầy đủ cho tất cả loại đề xuất
        const danhHieuMap: Record<string, string> = {
          // Cá nhân Hằng năm
          CSTDCS: 'Chiến sĩ thi đua cơ sở (CSTDCS)',
          CSTT: 'Chiến sĩ tiên tiến (CSTT)',
          BKBQP: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)',
          CSTDTQ: 'Chiến sĩ thi đua toàn quân (CSTDTQ)',
          // Đơn vị Hằng năm
          ĐVQT: 'Đơn vị Quyết thắng (ĐVQT)',
          ĐVTT: 'Đơn vị Tiên tiến (ĐVTT)',
          BKTTCP: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)',
          // Niên hạn
          HCCSVV_HANG_BA: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba',
          HCCSVV_HANG_NHI: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì',
          HCCSVV_HANG_NHAT: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất',
          // Cống hiến
          HCBVTQ_HANG_BA: 'Huân chương Bảo vệ Tổ quốc Hạng Ba',
          HCBVTQ_HANG_NHI: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì',
          HCBVTQ_HANG_NHAT: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất',
        };

        // Lấy options dựa trên loại đề xuất
        let options: { label: string; value: string }[] = [];
        switch (proposal.loai_de_xuat) {
          case 'CA_NHAN_HANG_NAM':
            options = [
              { label: 'Chiến sĩ thi đua cơ sở (CSTDCS)', value: 'CSTDCS' },
              { label: 'Chiến sĩ tiên tiến (CSTT)', value: 'CSTT' },
              { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
              { label: 'Chiến sĩ thi đua toàn quân (CSTDTQ)', value: 'CSTDTQ' },
            ];
            break;
          case 'DON_VI_HANG_NAM':
            options = [
              { label: 'Đơn vị Quyết thắng (ĐVQT)', value: 'ĐVQT' },
              { label: 'Đơn vị Tiên tiến (ĐVTT)', value: 'ĐVTT' },
              { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
              { label: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)', value: 'BKTTCP' },
            ];
            break;
          case 'NIEN_HAN':
            options = [
              { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba', value: 'HCCSVV_HANG_BA' },
              { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì', value: 'HCCSVV_HANG_NHI' },
              { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất', value: 'HCCSVV_HANG_NHAT' },
            ];
            break;
          case 'CONG_HIEN':
            options = [
              { label: 'Huân chương Bảo vệ Tổ quốc Hạng Ba', value: 'HCBVTQ_HANG_BA' },
              { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì', value: 'HCBVTQ_HANG_NHI' },
              { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất', value: 'HCBVTQ_HANG_NHAT' },
            ];
            break;
          default:
            options = [];
        }

        // Luôn hiển thị tên đầy đủ, không cho phép chỉnh sửa danh hiệu
        const fullName = danhHieuMap[record.danh_hieu || ''] || record.danh_hieu || '-';
        return <Text>{fullName}</Text>;
      },
    },
    ...(proposal?.loai_de_xuat === 'CONG_HIEN'
      ? [
          {
            title: 'Tổng thời gian (0.7)',
            key: 'total_time_0_7',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: DanhHieuItem) =>
              calculateTotalTimeByGroup(record.personnel_id, '0.7'),
          },
          {
            title: 'Tổng thời gian (0.8)',
            key: 'total_time_0_8',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: DanhHieuItem) =>
              calculateTotalTimeByGroup(record.personnel_id, '0.8'),
          },
          {
            title: 'Tổng thời gian (0.9-1.0)',
            key: 'total_time_0_9_1_0',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: DanhHieuItem) =>
              calculateTotalTimeByGroup(record.personnel_id, '0.9-1.0'),
          },
        ]
      : []),
    {
      title: 'Số quyết định',
      dataIndex: 'so_quyet_dinh',
      key: 'so_quyet_dinh',
      width: 180,
      render: (_: any, record: DanhHieuItem, index: number) => {
        // Kiểm tra cả so_quyet_dinh và các trường cũ để tương thích với dữ liệu cũ
        const soQuyetDinh =
          record.so_quyet_dinh || record.so_quyet_dinh_bkbqp || record.so_quyet_dinh_cstdtq;
        const fileQuyetDinh =
          record.file_quyet_dinh || record.file_quyet_dinh_bkbqp || record.file_quyet_dinh_cstdtq;

        if (!soQuyetDinh || (typeof soQuyetDinh === 'string' && soQuyetDinh.trim() === '')) {
          return <span style={{ color: '#999', fontWeight: 400 }}>Chưa có</span>;
        }
        return (
          <a
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenDecisionFile(soQuyetDinh, fileQuyetDinh);
            }}
            style={{
              color: '#52c41a',
              fontWeight: 500,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {soQuyetDinh}
          </a>
        );
      },
    },
  ];

  // Columns cho đề xuất đơn vị hằng năm
  const donViHangNamColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Loại đơn vị',
      key: 'loai_don_vi',
      width: 150,
      render: (_: any, record: DanhHieuItem) => {
        const type =
          record.don_vi_type ||
          (record.co_quan_don_vi_cha ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI');
        return (
          <Tag color={type === 'CO_QUAN_DON_VI' ? 'blue' : 'green'}>
            {type === 'CO_QUAN_DON_VI' ? 'Cơ quan đơn vị' : 'Đơn vị trực thuộc'}
          </Tag>
        );
      },
    },
    {
      title: 'Mã đơn vị',
      dataIndex: 'ma_don_vi',
      key: 'ma_don_vi',
      width: 150,
      render: (text: string) => <Text code>{text || '-'}</Text>,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'ten_don_vi',
      key: 'ten_don_vi',
      width: 250,
      render: (text: string) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.nam}
          type="number"
          onSave={val => updateDanhHieu(index, 'nam', parseInt(val))}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 200,
      render: (_: any, record: DanhHieuItem, index: number) => {
        // Map mã danh hiệu sang tên đầy đủ để hiển thị
        const danhHieuMap: Record<string, string> = {
          ĐVQT: 'Đơn vị Quyết thắng (ĐVQT)',
          ĐVTT: 'Đơn vị Tiên tiến (ĐVTT)',
          BKBQP: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)',
          BKTTCP: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)',
        };

        const fullName = danhHieuMap[record.danh_hieu || ''] || record.danh_hieu || '-';

        // Luôn hiển thị tên đầy đủ, không cho phép chỉnh sửa danh hiệu
        return <Text>{fullName || '-'}</Text>;
      },
    },
    {
      title: 'Số quyết định',
      dataIndex: 'so_quyet_dinh',
      key: 'so_quyet_dinh',
      width: 180,
      render: (_: any, record: DanhHieuItem, index: number) => {
        // Kiểm tra cả so_quyet_dinh và các trường cũ để tương thích với dữ liệu cũ
        const soQuyetDinh =
          record.so_quyet_dinh || record.so_quyet_dinh_bkbqp || record.so_quyet_dinh_cstdtq;
        const fileQuyetDinh =
          record.file_quyet_dinh || record.file_quyet_dinh_bkbqp || record.file_quyet_dinh_cstdtq;

        if (!soQuyetDinh || (typeof soQuyetDinh === 'string' && soQuyetDinh.trim() === '')) {
          return <span style={{ color: '#999', fontWeight: 400 }}>Chưa có</span>;
        }
        return (
          <a
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenDecisionFile(soQuyetDinh, fileQuyetDinh);
            }}
            style={{
              color: '#52c41a',
              fontWeight: 500,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {soQuyetDinh}
          </a>
        );
      },
    },
  ];

  const thanhTichColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 250,
      align: 'center' as const,
      render: (text: string, record: ThanhTichItem) => {
        const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
        const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
        const parts = [];
        if (donViTrucThuoc) parts.push(donViTrucThuoc);
        if (coQuanDonVi) parts.push(coQuanDonVi);
        const unitInfo = parts.length > 0 ? parts.join(', ') : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong>{text}</Text>
            {unitInfo && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                {unitInfo}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cấp bậc / Chức vụ',
      key: 'cap_bac_chuc_vu',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: ThanhTichItem) => {
        // Chỉ hiển thị nếu có dữ liệu trong dataJSON
        const capBac = record.cap_bac;
        const chucVu = record.chuc_vu;

        // Nếu không có cả cấp bậc và chức vụ, để trống
        if (!capBac && !chucVu) {
          return <span>-</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {capBac && <Text strong>{capBac}</Text>}
            {chucVu && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: capBac ? '4px' : '0' }}>
                {chucVu}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.nam}
          type="number"
          onSave={val => updateThanhTich(index, 'nam', parseInt(val))}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'loai',
      key: 'loai',
      width: 100,
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.loai}
          type="select"
          options={[
            { label: 'NCKH', value: 'NCKH' },
            { label: 'SKKH', value: 'SKKH' },
          ]}
          onSave={val => updateThanhTich(index, 'loai', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'mo_ta',
      key: 'mo_ta',
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.mo_ta}
          type="text"
          onSave={val => updateThanhTich(index, 'mo_ta', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Số quyết định',
      dataIndex: 'so_quyet_dinh',
      key: 'so_quyet_dinh',
      width: 180,
      render: (_: any, record: ThanhTichItem, index: number) => {
        const soQuyetDinh = record.so_quyet_dinh;
        if (!soQuyetDinh || (typeof soQuyetDinh === 'string' && soQuyetDinh.trim() === '')) {
          return <span style={{ color: '#999', fontWeight: 400 }}>Chưa có</span>;
        }
        return (
          <a
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenDecisionFile(soQuyetDinh, record.file_quyet_dinh);
            }}
            style={{
              color: '#52c41a',
              fontWeight: 500,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {soQuyetDinh}
          </a>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const thanhTichRowSelection = {
    selectedRowKeys: selectedThanhTichKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedThanhTichKeys(selectedKeys);
    },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/admin/proposals/review">Duyệt Đề Xuất</Breadcrumb.Item>
        <Breadcrumb.Item>Chi Tiết</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/proposals/review')}
          style={{ marginBottom: '16px' }}
        >
          Quay lại
        </Button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Title level={2}>Chi Tiết Đề Xuất</Title>
            <Paragraph>Xem và chỉnh sửa trước khi phê duyệt</Paragraph>
          </div>
          {proposal.status === 'APPROVED' ? (
            <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
              Đã phê duyệt
            </Tag>
          ) : (
            <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>
              Đang chờ duyệt
            </Tag>
          )}
        </div>
      </div>

      {messageAlert && (
        <Alert
          message={<div style={{ whiteSpace: 'pre-line' }}>{messageAlert.text}</div>}
          type={messageAlert.type}
          showIcon
          closable
          onClose={() => setMessageAlert(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card title="Thông tin chung" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Loại đề xuất
            </Text>
            <div style={{ fontWeight: 500, marginTop: '4px' }}>
              <Tag color="blue">
                {proposal.loai_de_xuat === 'CA_NHAN_HANG_NAM'
                  ? 'Cá nhân Hằng năm'
                  : proposal.loai_de_xuat === 'DON_VI_HANG_NAM'
                  ? 'Đơn vị Hằng năm'
                  : proposal.loai_de_xuat === 'NIEN_HAN'
                  ? 'Niên hạn'
                  : proposal.loai_de_xuat === 'CONG_HIEN'
                  ? 'Cống hiến'
                  : proposal.loai_de_xuat === 'NCKH'
                  ? 'ĐTKH/SKKH'
                  : proposal.loai_de_xuat}
              </Tag>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Đơn vị
            </Text>
            <div style={{ fontWeight: 500 }}>
              {proposal.don_vi.ten_don_vi} ({proposal.don_vi.ma_don_vi})
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Trạng thái
            </Text>
            <div style={{ fontWeight: 500 }}>
              {proposal.status === 'PENDING' ? (
                <Tag color="warning">Đang chờ duyệt</Tag>
              ) : proposal.status === 'APPROVED' ? (
                <Tag color="success">Đã phê duyệt</Tag>
              ) : (
                <Tag color="error">Từ chối</Tag>
              )}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Người đề xuất
            </Text>
            <div style={{ fontWeight: 500 }}>{proposal.nguoi_de_xuat.ho_ten}</div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Ngày gửi
            </Text>
            <div style={{ fontWeight: 500 }}>
              {format(new Date(proposal.createdAt), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
          {proposal.status === 'APPROVED' && proposal.ngay_duyet && (
            <>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Người phê duyệt
                </Text>
                <div style={{ fontWeight: 500 }}>
                  {proposal.nguoi_duyet?.ho_ten || proposal.nguoi_duyet?.username || '-'}
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Ngày phê duyệt
                </Text>
                <div style={{ fontWeight: 500 }}>
                  {format(new Date(proposal.ngay_duyet), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* File đính kèm */}
        {proposal.files_attached && proposal.files_attached.length > 0 && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <Text
              type="secondary"
              style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}
            >
              File đính kèm ({proposal.files_attached.length} file)
            </Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {proposal.files_attached.map((file: any, index: number) => (
                <div
                  key={index}
                  className="file-attachment-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                    <Text style={{ fontSize: '14px' }}>
                      {file.originalName ||
                        file.originalname ||
                        file.filename ||
                        'Không có tên file'}
                    </Text>
                    {file.size && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({(file.size / 1024).toFixed(2)} KB)
                      </Text>
                    )}
                  </div>
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    style={{ padding: '0 8px', borderRadius: '6px' }}
                    onClick={async () => {
                      try {
                        const filename = file.filename;
                        const response = await axiosInstance.get(
                          `/api/proposals/uploads/${filename}`,
                          {
                            responseType: 'blob',
                          }
                        );
                        const blob = response.data;
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download =
                          file.originalName || file.originalname || file.filename || 'download';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        message.success('Tải file thành công');
                      } catch (error) {
                        message.error('Lỗi khi tải file');
                        console.error('Download error:', error);
                      }
                    }}
                  >
                    Tải về
                  </Button>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* Hiển thị theo loại đề xuất - không chia tab */}
      {proposal.loai_de_xuat === 'NCKH' ? (
        // Component cho đề xuất NCKH (ĐTKH/SKKH) - chỉ hiển thị Thành Tích
        <Card
          title="Thành Tích Khoa Học"
          extra={
            proposal.status === 'PENDING' &&
            selectedThanhTichKeys.length > 0 && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDecisionModalType('thanh_tich');
                  setDecisionModalVisible(true);
                }}
              >
                Thêm số quyết định ({selectedThanhTichKeys.length} thành tích)
              </Button>
            )
          }
        >
          {editedThanhTich.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu thành tích"
            />
          ) : (
            <Table
              rowSelection={proposal.status === 'PENDING' ? thanhTichRowSelection : undefined}
              columns={thanhTichColumns}
              dataSource={editedThanhTich}
              rowKey={(_, index) => index}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ) : proposal.loai_de_xuat === 'NIEN_HAN' ||
        proposal.loai_de_xuat === 'HC_QKQT' ||
        proposal.loai_de_xuat === 'KNC_VSNXD_QDNDVN' ? (
        // Component cho đề xuất NIEN_HAN - hiển thị từ editedNienHan
        <Card
          title={
            proposal.loai_de_xuat === 'NIEN_HAN'
              ? 'Danh Sách Niên Hạn'
              : proposal.loai_de_xuat === 'HC_QKQT'
              ? 'Huân Chương Quân Kỳ Quyết Thắng'
              : 'Kỷ Niệm Chương Vì Sự Nghiệp XD QĐNDVN'
          }
          extra={
            proposal.status === 'PENDING' &&
            selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDecisionModalType('danh_hieu');
                  setDecisionModalVisible(true);
                }}
              >
                Thêm số quyết định ({selectedRowKeys.length} người)
              </Button>
            )
          }
        >
          {editedNienHan.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu niên hạn"
            />
          ) : (
            <Table
              rowSelection={proposal.status === 'PENDING' ? rowSelection : undefined}
              columns={caNhanHangNamColumns}
              dataSource={editedNienHan}
              rowKey={(_, index) => index}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ) : proposal.loai_de_xuat === 'CONG_HIEN' ? (
        // Component cho đề xuất CỐNG HIẾN - hiển thị từ editedCongHien
        <Card
          title="Danh Sách Cống Hiến"
          extra={
            proposal.status === 'PENDING' &&
            selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDecisionModalType('danh_hieu');
                  setDecisionModalVisible(true);
                }}
              >
                Thêm số quyết định ({selectedRowKeys.length} người)
              </Button>
            )
          }
        >
          {editedCongHien.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu cống hiến"
            />
          ) : (
            <Table
              rowSelection={proposal.status === 'PENDING' ? rowSelection : undefined}
              columns={caNhanHangNamColumns}
              dataSource={editedCongHien}
              rowKey={(_, index) => index}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ) : editedDanhHieu.length > 0 ? (
        // Component cho đề xuất có danh hiệu - chỉ hiển thị Danh Hiệu
        <Card
          title={
            proposal.loai_de_xuat === 'DON_VI_HANG_NAM'
              ? 'Danh Hiệu Đơn Vị Hằng Năm'
              : 'Danh Hiệu Hằng Năm'
          }
          extra={
            proposal.status === 'PENDING' &&
            selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDecisionModalType('danh_hieu');
                  setDecisionModalVisible(true);
                }}
              >
                Thêm số quyết định ({selectedRowKeys.length}{' '}
                {proposal.loai_de_xuat === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'người'})
              </Button>
            )
          }
        >
          {editedDanhHieu.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu danh hiệu"
            />
          ) : (
            <Table
              rowSelection={proposal.status === 'PENDING' ? rowSelection : undefined}
              columns={
                proposal.loai_de_xuat === 'DON_VI_HANG_NAM'
                  ? donViHangNamColumns
                  : proposal.loai_de_xuat === 'CA_NHAN_HANG_NAM'
                  ? caNhanHangNamColumns
                  : caNhanHangNamColumns
              }
              dataSource={editedDanhHieu}
              rowKey={(_, index) => index}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ) : null}

      {proposal.status === 'PENDING' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 24 }}>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setRejectModalVisible(true)}
            size="large"
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            icon={approving ? <LoadingOutlined /> : <CheckCircleOutlined />}
            onClick={handleApprove}
            loading={approving}
            size="large"
          >
            {approving ? 'Đang phê duyệt...' : 'Phê Duyệt'}
          </Button>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        title="Từ chối đề xuất"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setGhiChu('');
        }}
        onOk={handleReject}
        confirmLoading={rejecting}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Alert
          message="Lưu ý"
          description="Vui lòng nhập lý do từ chối để Manager biết và chỉnh sửa lại đề xuất."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          placeholder="Nhập lý do từ chối (bắt buộc)"
          rows={5}
          value={ghiChu}
          onChange={e => setGhiChu(e.target.value)}
          showCount
          maxLength={500}
        />
      </Modal>

      {/* Decision Modal */}
      <DecisionModal
        visible={decisionModalVisible}
        onClose={() => setDecisionModalVisible(false)}
        onSuccess={handleDecisionSuccess}
        loaiKhenThuong="CA_NHAN_HANG_NAM"
      />
    </div>
  );
}
