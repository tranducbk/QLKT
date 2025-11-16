'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Alert, Typography, Space, message, Button } from 'antd';
import { EditOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';
import PositionHistoryModal from './PositionHistoryModal';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  cap_bac?: string;
  gioi_tinh?: string | null;
  ChucVu?: {
    id: string;
    ten_chuc_vu: string;
  };
  CoQuanDonVi?: {
    ten_don_vi: string;
  };
  DonViTrucThuoc?: {
    ten_don_vi: string;
    CoQuanDonVi?: {
      ten_don_vi: string;
    };
  };
}

interface TitleData {
  personnel_id?: string;
  danh_hieu?: string;
}

interface Step3SetTitlesCongHienProps {
  selectedPersonnelIds: string[];
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitlesCongHien({
  selectedPersonnelIds,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesCongHienProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [positionHistoriesMap, setPositionHistoriesMap] = useState<Record<string, any[]>>({});
  const [positionHistoryModalVisible, setPositionHistoryModalVisible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [positionHistory, setPositionHistory] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    if (selectedPersonnelIds.length > 0) {
      fetchPersonnelDetails();
    } else {
      setPersonnel([]);
      onTitleDataChange([]);
    }
  }, [selectedPersonnelIds]);

  const fetchPersonnelDetails = async () => {
    try {
      setLoading(true);
      const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
      const responses = await Promise.all(promises);
      const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);
      setPersonnel(personnelData);

      // Fetch lịch sử chức vụ
      if (personnelData.length > 0) {
        await fetchPositionHistories(personnelData);
      }

      // Initialize title data if empty
      if (titleData.length === 0) {
        const initialData = personnelData.map((p: Personnel) => ({
          personnel_id: p.id,
        }));
        onTitleDataChange(initialData);
      }
    } catch (error) {
      console.error('Error fetching personnel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionHistories = async (personnelList: Personnel[]) => {
    try {
      const historiesMap: Record<string, any[]> = {};

      await Promise.all(
        personnelList.map(async p => {
          if (p.id) {
            try {
              const res = await apiClient.getPositionHistory(p.id);
              if (res.success && res.data) {
                historiesMap[p.id] = res.data;
              }
            } catch (error) {
              historiesMap[p.id] = [];
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

  // Tính tổng thời gian (theo tháng) cho một nhóm hệ số
  const getTotalMonthsByGroup = (personnelId: string, group: '0.7' | '0.8' | '0.9-1.0'): number => {
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

    return totalMonths;
  };

  // Kiểm tra quân nhân có đủ điều kiện cho hạng cống hiến không
  // Hạng cao có thể cộng thêm vào hạng thấp hơn
  // Lưu ý: Nữ giảm 1/3 thời gian (chỉ cần 2/3), làm tròn tới tháng
  const checkEligibleForRank = (
    personnelId: string,
    rank: 'HANG_NHAT' | 'HANG_NHI' | 'HANG_BA'
  ): boolean => {
    const months0_9_1_0 = getTotalMonthsByGroup(personnelId, '0.9-1.0');
    const months0_8 = getTotalMonthsByGroup(personnelId, '0.8');
    const months0_7 = getTotalMonthsByGroup(personnelId, '0.7');

    // Tính số tháng yêu cầu dựa trên giới tính
    const baseRequiredMonths = 10 * 12; // 10 năm = 120 tháng (cho nam)
    const femaleRequiredMonths = Math.round(baseRequiredMonths * (2 / 3)); // Nữ: 80 tháng (làm tròn)

    // Lấy thông tin quân nhân để biết giới tính
    const personnelDetail = personnel.find(p => p.id === personnelId);
    const requiredMonths =
      personnelDetail?.gioi_tinh === 'NU' ? femaleRequiredMonths : baseRequiredMonths;

    if (rank === 'HANG_NHAT') {
      // Hạng nhất: cần >= yêu cầu từ nhóm 0.9-1.0
      return months0_9_1_0 >= requiredMonths;
    } else if (rank === 'HANG_NHI') {
      // Hạng nhì: cần >= yêu cầu từ nhóm 0.8 + 0.9-1.0 (hạng cao cộng vào)
      return months0_8 + months0_9_1_0 >= requiredMonths;
    } else if (rank === 'HANG_BA') {
      // Hạng ba: cần >= yêu cầu từ nhóm 0.7 + 0.8 + 0.9-1.0 (tất cả hạng cao cộng vào)
      return months0_7 + months0_8 + months0_9_1_0 >= requiredMonths;
    }

    return false;
  };

  const getDanhHieuOptions = () => {
    return [
      { label: 'Huân chương Bảo vệ Tổ quốc Hạng Ba', value: 'HCBVTQ_HANG_BA' },
      { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì', value: 'HCBVTQ_HANG_NHI' },
      { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất', value: 'HCBVTQ_HANG_NHAT' },
    ];
  };

  const updateTitle = async (id: string, field: string, value: any) => {
    // Validation cho CONG_HIEN: Kiểm tra điều kiện thời gian khi chọn danh hiệu
    if (field === 'danh_hieu' && value) {
      const personnelRecord = personnel.find(p => p.id === id);
      if (personnelRecord) {
        let rankName = '';
        let eligible = false;

        if (value === 'HCBVTQ_HANG_NHAT') {
          eligible = checkEligibleForRank(id, 'HANG_NHAT');
          rankName = 'Hạng Nhất';
        } else if (value === 'HCBVTQ_HANG_NHI') {
          eligible = checkEligibleForRank(id, 'HANG_NHI');
          rankName = 'Hạng Nhì';
        } else if (value === 'HCBVTQ_HANG_BA') {
          eligible = checkEligibleForRank(id, 'HANG_BA');
          rankName = 'Hạng Ba';
        }

        if (!eligible && rankName) {
          const months0_9_1_0 = getTotalMonthsByGroup(id, '0.9-1.0');
          const months0_8 = getTotalMonthsByGroup(id, '0.8');
          const months0_7 = getTotalMonthsByGroup(id, '0.7');

          let totalMonths = 0;
          if (value === 'HCBVTQ_HANG_NHAT') {
            totalMonths = months0_9_1_0;
          } else if (value === 'HCBVTQ_HANG_NHI') {
            totalMonths = months0_8 + months0_9_1_0;
          } else if (value === 'HCBVTQ_HANG_BA') {
            totalMonths = months0_7 + months0_8 + months0_9_1_0;
          }

          const totalYears = Math.floor(totalMonths / 12);
          const remainingMonths = totalMonths % 12;
          const totalYearsText =
            totalYears > 0 && remainingMonths > 0
              ? `${totalYears} năm ${remainingMonths} tháng`
              : totalYears > 0
              ? `${totalYears} năm`
              : `${remainingMonths} tháng`;

          message.error(
            `Quân nhân "${personnelRecord.ho_ten}" không đủ điều kiện đề xuất Huân chương Bảo vệ Tổ quốc ${rankName}. ` +
              `Yêu cầu: ít nhất 10 năm. Hiện tại: ${totalYearsText}. ` +
              `Vui lòng kiểm tra lại lịch sử chức vụ của quân nhân này.`
          );
          return; // Không cập nhật nếu không đủ điều kiện
        }
      }
    }

    const newData = [...titleData];
    const index = newData.findIndex(d => d.personnel_id === id);
    if (index >= 0) {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      newData.push({ personnel_id: id, [field]: value });
    }

    onTitleDataChange(newData);
  };

  const getTitleData = (id: string) => {
    return titleData.find(d => d.personnel_id === id) || { personnel_id: id };
  };

  const handleViewHistory = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);
    setPositionHistoryModalVisible(true);

    try {
      const historyRes = await apiClient.getPositionHistory(record.id);
      if (historyRes.success && historyRes.data) {
        setPositionHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } else {
        setPositionHistory([]);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      message.error('Không thể tải lịch sử chức vụ');
      setPositionHistory([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const columns: ColumnsType<Personnel> = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 250,
      align: 'center',
      render: (text, record) => {
        const donViTrucThuoc = record.DonViTrucThuoc?.ten_don_vi;
        const coQuanDonVi =
          record.CoQuanDonVi?.ten_don_vi || record.DonViTrucThuoc?.CoQuanDonVi?.ten_don_vi;
        const parts = [];
        if (donViTrucThuoc) parts.push(donViTrucThuoc);
        if (coQuanDonVi) parts.push(coQuanDonVi);
        const unitInfo = parts.length > 0 ? parts.join(', ') : null;

        const genderText =
          record.gioi_tinh === 'NAM'
            ? 'Nam'
            : record.gioi_tinh === 'NU'
            ? 'Nữ'
            : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong>{text}</Text>
            {genderText && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                {genderText}
              </Text>
            )}
            {unitInfo && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '2px' }}>
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
      width: 200,
      align: 'center',
      render: (_, record) => {
        const capBac = record.cap_bac;
        const chucVu = record.ChucVu?.ten_chuc_vu;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong style={{ marginBottom: '4px' }}>
              {capBac || '-'}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {chucVu || '-'}
            </Text>
          </div>
        );
      },
    },
    {
      title: (
        <span>
          Danh hiệu <Text type="danger">*</Text>
        </span>
      ),
      key: 'danh_hieu',
      width: 200,
      align: 'center',
      render: (_, record) => {
        const data = getTitleData(record.id);

        // Lọc danh hiệu dựa trên điều kiện thời gian
        let availableOptions = getDanhHieuOptions();
        availableOptions = availableOptions.filter(option => {
          if (option.value === 'HCBVTQ_HANG_NHAT') {
            return checkEligibleForRank(record.id, 'HANG_NHAT');
          } else if (option.value === 'HCBVTQ_HANG_NHI') {
            return checkEligibleForRank(record.id, 'HANG_NHI');
          } else if (option.value === 'HCBVTQ_HANG_BA') {
            return checkEligibleForRank(record.id, 'HANG_BA');
          }
          return true;
        });

        return (
          <Select
            value={data.danh_hieu}
            onChange={value => updateTitle(record.id, 'danh_hieu', value)}
            placeholder="Chọn danh hiệu"
            style={{ width: '100%' }}
            size="middle"
            allowClear
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { minWidth: 'max-content' } } }}
            options={availableOptions}
            disabled={availableOptions.length === 0}
          />
        );
      },
    },
    {
      title: 'Xem lịch sử khen thưởng',
      key: 'history',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<HistoryOutlined />}
          onClick={() => handleViewHistory(record)}
          size="small"
        >
          Xem lịch sử
        </Button>
      ),
    },
    {
      title: 'Tổng thời gian (0.7)',
      key: 'total_time_0_7',
      width: 150,
      align: 'center',
      render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.7'),
    },
    {
      title: 'Tổng thời gian (0.8)',
      key: 'total_time_0_8',
      width: 150,
      align: 'center',
      render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.8'),
    },
    {
      title: 'Tổng thời gian (0.9-1.0)',
      key: 'total_time_0_9_1_0',
      width: 150,
      align: 'center',
      render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.9-1.0'),
    },
  ];

  const allTitlesSet = personnel.every(p => {
    const data = getTitleData(p.id);
    return data.danh_hieu;
  });

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <div>
            <p>
              1. Chọn danh hiệu khen thưởng cho từng quân nhân đã chọn (
              <strong>{personnel.length}</strong> quân nhân)
            </p>
            <p style={{ marginTop: 8, paddingLeft: 16, borderLeft: '3px solid #1890ff' }}>
              <strong>Lưu ý cho đề xuất Cống hiến:</strong>
              <br />- Yêu cầu thời gian: <strong>Nam: 10 năm (120 tháng)</strong>,{' '}
              <strong>Nữ: 6 năm 8 tháng (80 tháng)</strong> - giảm 1/3 thời gian
              <br />
              - Hạng Nhất: cần từ nhóm hệ số 0.9-1.0
              <br />
              - Hạng Nhì: cần từ nhóm hệ số 0.8 + 0.9-1.0 (hạng cao cộng vào)
              <br />- Hạng Ba: cần từ nhóm hệ số 0.7 + 0.8 + 0.9-1.0 (tất cả hạng cao cộng vào)
            </p>
            <p>2. Đảm bảo tất cả quân nhân đều đã được chọn danh hiệu</p>
            <p>3. Sau khi hoàn tất, nhấn &quot;Tiếp tục&quot; để sang bước upload file</p>
          </div>
        }
        type="info"
        showIcon
        icon={<EditOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" style={{ marginBottom: 16, width: '100%' }} size="small">
        <Text type="secondary">
          Tổng số quân nhân: <strong>{personnel.length}</strong>
        </Text>
        <Text type={allTitlesSet ? 'success' : 'warning'}>
          Đã set danh hiệu:{' '}
          <strong>
            {titleData.filter(d => d.danh_hieu).length}/{personnel.length}
          </strong>
          {allTitlesSet && ' ✓'}
        </Text>
      </Space>

      <Table<Personnel>
        columns={columns}
        dataSource={personnel}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
        bordered
        locale={{
          emptyText: 'Không có dữ liệu',
        }}
      />

      <PositionHistoryModal
        visible={positionHistoryModalVisible}
        personnel={selectedPersonnel}
        positionHistory={positionHistory}
        loading={loadingModal}
        onClose={() => {
          setPositionHistoryModalVisible(false);
          setSelectedPersonnel(null);
          setPositionHistory([]);
        }}
      />
    </div>
  );
}
