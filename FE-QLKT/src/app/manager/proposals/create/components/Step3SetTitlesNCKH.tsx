'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Input, Alert, Typography, Space, Button, Modal, Tabs, Tag } from 'antd';
import { EditOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import ScientificAchievementHistoryModal from './ScientificAchievementHistoryModal';

const { Text } = Typography;
const { TextArea } = Input;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  ngay_sinh?: string | null;
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
  loai?: 'NCKH' | 'SKKH';
  mo_ta?: string;
}

interface NCKHItem {
  nam: number;
  loai: string;
  mo_ta: string;
  status?: string;
  so_quyet_dinh?: string | null;
  [key: string]: any;
}

interface Step3SetTitlesNCKHProps {
  selectedPersonnelIds: string[];
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitlesNCKH({
  selectedPersonnelIds,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesNCKHProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [scientificAchievementHistoryModalVisible, setScientificAchievementHistoryModalVisible] =
    useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [annualProfile, setAnnualProfile] = useState<any>(null);
  const [scientificAchievements, setScientificAchievements] = useState<any[]>([]);
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

  const updateTitle = (id: string, field: string, value: any) => {
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
      setAnnualProfile(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleViewHistory = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);
    setScientificAchievementHistoryModalVisible(true);

    try {
      const achievementsRes = await apiClient.getScientificAchievements(record.id);
      if (achievementsRes.success && achievementsRes.data) {
        setScientificAchievements(Array.isArray(achievementsRes.data) ? achievementsRes.data : []);
      } else {
        setScientificAchievements([]);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      setScientificAchievements([]);
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
      title: 'Ngày sinh',
      dataIndex: 'ngay_sinh',
      key: 'ngay_sinh',
      width: 140,
      align: 'center',
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: (
        <span>
          Loại <Text type="danger">*</Text>
        </span>
      ),
      key: 'loai',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <Select
            value={data.loai}
            onChange={value => updateTitle(record.id, 'loai', value)}
            placeholder="Chọn loại"
            style={{ width: '100%', fontSize: '14px' }}
            size="middle"
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { minWidth: 'max-content' } } }}
            options={[
              { label: 'Đề tài khoa học', value: 'NCKH' },
              { label: 'Sáng kiến khoa học', value: 'SKKH' },
            ]}
          />
        );
      },
    },
    {
      title: (
        <span>
          Mô tả <Text type="danger">*</Text>
        </span>
      ),
      key: 'mo_ta',
      width: 400,
      align: 'center',
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <TextArea
            value={data.mo_ta}
            onChange={e => updateTitle(record.id, 'mo_ta', e.target.value)}
            placeholder="Nhập mô tả chi tiết về đề tài hoặc thành tích..."
            rows={1}
            maxLength={500}
            showCount
            style={{ fontSize: '14px' }}
          />
        );
      },
    },
    {
      title: 'Xem lịch sử',
      key: 'history',
      width: 150,
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
    return data.loai && data.mo_ta;
  });

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <div>
            <p>
              1. Chọn loại và nhập mô tả cho từng quân nhân đã chọn (
              <strong>{personnel.length}</strong> quân nhân)
            </p>
            <p>2. Đảm bảo tất cả quân nhân đều đã được chọn loại và nhập mô tả</p>
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
          Đã set thông tin:{' '}
          <strong>
            {titleData.filter(d => d.loai && d.mo_ta).length}/{personnel.length}
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
            <EyeOutlined /> Thông tin NCKH/SKKH - {selectedPersonnel?.ho_ten}
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

      <ScientificAchievementHistoryModal
        visible={scientificAchievementHistoryModalVisible}
        personnel={selectedPersonnel}
        achievements={scientificAchievements}
        loading={loadingModal}
        onClose={() => {
          setScientificAchievementHistoryModalVisible(false);
          setSelectedPersonnel(null);
          setScientificAchievements([]);
        }}
      />
    </div>
  );
}
