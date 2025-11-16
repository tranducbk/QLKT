'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Alert, Typography, Space, message, Button, Modal, Tabs, Tag } from 'antd';
import { EditOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';
import PersonnelRewardHistoryModal from './PersonnelRewardHistoryModal';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  cap_bac?: string;
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

interface CSTDCSItem {
  nam: number;
  danh_hieu: string;
  nhan_bkbqp?: boolean;
  nhan_cstdtq?: boolean;
  so_quyet_dinh_bkbqp?: string | null;
  so_quyet_dinh_cstdtq?: string | null;
  [key: string]: any;
}

interface NCKHItem {
  nam: number;
  loai: string;
  mo_ta: string;
  status?: string;
  so_quyet_dinh?: string | null;
  [key: string]: any;
}

interface Step3SetTitlesCaNhanHangNamProps {
  selectedPersonnelIds: string[];
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitlesCaNhanHangNam({
  selectedPersonnelIds,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesCaNhanHangNamProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [annualProfile, setAnnualProfile] = useState<any>(null);
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

  // Xác định loại danh hiệu đã được chọn trong đề xuất
  const getSelectedDanhHieuType = () => {
    const selectedDanhHieus = titleData.map(item => item.danh_hieu).filter(Boolean);

    if (selectedDanhHieus.length === 0) return null;

    // Kiểm tra xem có CSTDCS/CSTT không
    const hasChinh = selectedDanhHieus.some(dh => dh === 'CSTDCS' || dh === 'CSTT');
    const hasBKBQP = selectedDanhHieus.some(dh => dh === 'BKBQP');
    const hasCSTDTQ = selectedDanhHieus.some(dh => dh === 'CSTDTQ');

    if (hasChinh) {
      return 'chinh'; // CSTDCS/CSTT
    } else if (hasBKBQP || hasCSTDTQ) {
      return 'bkbqp_cstdtq'; // BKBQP và CSTDTQ có thể cùng nhau
    }
    return null;
  };

  const getDanhHieuOptions = () => {
    const selectedType = getSelectedDanhHieuType();
    const allOptions = [
      { label: 'Chiến sĩ thi đua cơ sở (CSTDCS)', value: 'CSTDCS' },
      { label: 'Chiến sĩ tiên tiến (CSTT)', value: 'CSTT' },
      { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
      { label: 'Chiến sĩ thi đua toàn quân (CSTDTQ)', value: 'CSTDTQ' },
    ];

    // Nếu đã chọn CSTDCS/CSTT, chỉ hiển thị CSTDCS/CSTT
    // Nếu đã chọn BKBQP/CSTDTQ, có thể chọn cả BKBQP và CSTDTQ
    if (selectedType === 'chinh') {
      return allOptions.filter(opt => opt.value === 'CSTDCS' || opt.value === 'CSTT');
    } else if (selectedType === 'bkbqp_cstdtq') {
      return allOptions.filter(opt => opt.value === 'BKBQP' || opt.value === 'CSTDTQ');
    }

    return allOptions;
  };

  const updateTitle = async (id: string, field: string, value: any) => {
    // Validation: Kiểm tra nếu đang chọn danh hiệu và đã có danh hiệu khác loại
    if (field === 'danh_hieu' && value) {
      const selectedType = getSelectedDanhHieuType();
      const isChinh = value === 'CSTDCS' || value === 'CSTT';
      const isBKBQP_CSTDTQ = value === 'BKBQP' || value === 'CSTDTQ';

      // Kiểm tra xem có mix CSTDCS/CSTT với BKBQP/CSTDTQ không
      if (selectedType === 'chinh' && isBKBQP_CSTDTQ) {
        // Đã có CSTDCS/CSTT, không cho phép thêm BKBQP/CSTDTQ
        const currentData = titleData.find(d => d.personnel_id === id);
        if (!currentData || !currentData.danh_hieu) {
          message.warning(
            'Không thể đề xuất CSTDCS/CSTT cùng với BKBQP/CSTDTQ trong một đề xuất. ' +
              'Vui lòng tạo đề xuất riêng cho loại danh hiệu này.'
          );
          return;
        }
      } else if (selectedType === 'bkbqp_cstdtq' && isChinh) {
        // Đã có BKBQP/CSTDTQ, không cho phép thêm CSTDCS/CSTT
        const currentData = titleData.find(d => d.personnel_id === id);
        if (!currentData || !currentData.danh_hieu) {
          message.warning(
            'Không thể đề xuất CSTDCS/CSTT cùng với BKBQP/CSTDTQ trong một đề xuất. ' +
              'Vui lòng tạo đề xuất riêng cho loại danh hiệu này.'
          );
          return;
        }
      }
    }

    // Kiểm tra đề xuất trùng: cùng năm và cùng danh hiệu
    if (field === 'danh_hieu' && value) {
      const personnelDetail = personnel.find(p => p.id === id);
      if (personnelDetail) {
        try {
          const response = await axiosInstance.get('/api/proposals/check-duplicate', {
            params: {
              personnel_id: id,
              nam: nam,
              danh_hieu: value,
              proposal_type: 'CA_NHAN_HANG_NAM',
            },
          });

          if (response.data.success && response.data.data.exists) {
            message.warning(
              `${personnelDetail.ho_ten}: ${response.data.data.message}. Vui lòng kiểm tra lại.`
            );
            // Vẫn cho phép chọn nhưng cảnh báo
          }
        } catch (error: any) {
          console.error('Error checking duplicate award:', error);
          // Không block nếu lỗi API, chỉ log
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

  const handleViewDetails = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);
    setModalVisible(true);

    try {
      const profileRes = await apiClient.getAnnualProfile(record.id, nam);
      if (profileRes.success && profileRes.data) {
        setAnnualProfile(profileRes.data);
      } else {
        setAnnualProfile(null);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      message.error('Không thể tải thông tin chi tiết');
      setAnnualProfile(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleViewHistory = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);
    setHistoryModalVisible(true);

    try {
      const profileRes = await apiClient.getAnnualProfile(record.id, nam);
      if (profileRes.success && profileRes.data) {
        setAnnualProfile(profileRes.data);
      } else {
        setAnnualProfile(null);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      message.error('Không thể tải lịch sử khen thưởng');
      setAnnualProfile(null);
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
      render: (_, record, index) => (
        <span
          style={{ cursor: 'pointer', color: '#1890ff' }}
          onClick={() => handleViewDetails(record)}
          onMouseEnter={e => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {index + 1}
        </span>
      ),
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
        const availableOptions = getDanhHieuOptions();

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
            <p>
              2. <strong>Lưu ý:</strong> Không thể đề xuất CSTDCS/CSTT cùng với BKBQP/CSTDTQ trong
              một đề xuất. BKBQP và CSTDTQ có thể đề xuất cùng nhau.
            </p>
            <p>3. Đảm bảo tất cả quân nhân đều đã được chọn danh hiệu</p>
            <p>4. Sau khi hoàn tất, nhấn &quot;Tiếp tục&quot; để sang bước upload file</p>
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

      {/* Modal xem danh hiệu và NCKH */}
      <Modal
        title={
          <span>
            <EyeOutlined /> Thông tin danh hiệu và NCKH - {selectedPersonnel?.ho_ten}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedPersonnel(null);
          setAnnualProfile(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setModalVisible(false);
              setSelectedPersonnel(null);
              setAnnualProfile(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
        loading={loadingModal}
      >
        {annualProfile && (
          <Tabs
            items={[
              {
                key: 'CSTDCS',
                label: `Danh hiệu CSTDCS (${
                  Array.isArray(annualProfile.tong_cstdcs) ? annualProfile.tong_cstdcs.length : 0
                })`,
                children: (
                  <div>
                    {Array.isArray(annualProfile.tong_cstdcs) &&
                    annualProfile.tong_cstdcs.length > 0 ? (
                      <Table<CSTDCSItem>
                        dataSource={annualProfile.tong_cstdcs}
                        rowKey={(record, index) => `${record.nam}-${index}`}
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Năm',
                            dataIndex: 'nam',
                            key: 'nam',
                            width: 100,
                            align: 'center',
                          },
                          {
                            title: 'Danh hiệu',
                            dataIndex: 'danh_hieu',
                            key: 'danh_hieu',
                            width: 150,
                            align: 'center',
                            render: text => {
                              const map: Record<string, string> = {
                                CSTDCS: 'Chiến sĩ thi đua cơ sở',
                                CSTT: 'Chiến sĩ thi đua',
                              };
                              return map[text] || text;
                            },
                          },
                          {
                            title: 'Nhận BKBQP',
                            dataIndex: 'nhan_bkbqp',
                            key: 'nhan_bkbqp',
                            width: 120,
                            align: 'center',
                            render: value =>
                              value ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
                          },
                          {
                            title: 'Nhận CSTDTQ',
                            dataIndex: 'nhan_cstdtq',
                            key: 'nhan_cstdtq',
                            width: 120,
                            align: 'center',
                            render: value =>
                              value ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
                          },
                          {
                            title: 'Số QĐ BKBQP',
                            dataIndex: 'so_quyet_dinh_bkbqp',
                            key: 'so_quyet_dinh_bkbqp',
                            width: 150,
                            align: 'center',
                            render: text => text || '-',
                          },
                          {
                            title: 'Số QĐ CSTDTQ',
                            dataIndex: 'so_quyet_dinh_cstdtq',
                            key: 'so_quyet_dinh_cstdtq',
                            width: 150,
                            align: 'center',
                            render: text => text || '-',
                          },
                        ]}
                      />
                    ) : (
                      <Text type="secondary">Chưa có danh hiệu CSTDCS</Text>
                    )}
                  </div>
                ),
              },
              {
                key: 'nckh',
                label: `NCKH/SKKH (${
                  Array.isArray(annualProfile.tong_nckh) ? annualProfile.tong_nckh.length : 0
                })`,
                children: (
                  <div>
                    {Array.isArray(annualProfile.tong_nckh) &&
                    annualProfile.tong_nckh.length > 0 ? (
                      <Table<NCKHItem>
                        dataSource={annualProfile.tong_nckh}
                        rowKey={(record, index) => `${record.nam}-${index}`}
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Năm',
                            dataIndex: 'nam',
                            key: 'nam',
                            width: 100,
                            align: 'center',
                          },
                          {
                            title: 'Loại',
                            dataIndex: 'loai',
                            key: 'loai',
                            width: 150,
                            align: 'center',
                            render: text => {
                              const map: Record<string, string> = {
                                NCKH: 'Đề tài khoa học',
                                SKKH: 'Sáng kiến khoa học',
                              };
                              return map[text] || text;
                            },
                          },
                          {
                            title: 'Mô tả',
                            dataIndex: 'mo_ta',
                            key: 'mo_ta',
                            align: 'left',
                          },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            key: 'status',
                            width: 120,
                            align: 'center',
                            render: status => {
                              const color = status === 'APPROVED' ? 'green' : 'orange';
                              const text = status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt';
                              return <Tag color={color}>{text}</Tag>;
                            },
                          },
                          {
                            title: 'Số QĐ',
                            dataIndex: 'so_quyet_dinh',
                            key: 'so_quyet_dinh',
                            width: 150,
                            align: 'center',
                            render: text => text || '-',
                          },
                        ]}
                      />
                    ) : (
                      <Text type="secondary">Chưa có thành tích NCKH/SKKH</Text>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
        {!annualProfile && !loadingModal && (
          <Text type="secondary">Không có dữ liệu hồ sơ hằng năm</Text>
        )}
      </Modal>

      <PersonnelRewardHistoryModal
        visible={historyModalVisible}
        personnel={selectedPersonnel}
        annualProfile={annualProfile}
        loading={loadingModal}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedPersonnel(null);
          setAnnualProfile(null);
        }}
      />
    </div>
  );
}
