'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Alert, Typography, Space, Tag, Button } from 'antd';
import { EditOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api-client';
import UnitAnnualAwardHistoryModal from './UnitAnnualAwardHistoryModal';
import { all } from 'axios';

const { Text } = Typography;

interface Unit {
  id: string;
  ten_don_vi: string;
  ma_don_vi: string;
  co_quan_don_vi_id?: string;
  CoQuanDonVi?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
  };
}

interface TitleData {
  don_vi_id?: string;
  don_vi_type?: 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC';
  danh_hieu?: string;
}

interface Step3SetTitlesDonViHangNamProps {
  selectedUnitIds: string[];
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitlesDonViHangNam({
  selectedUnitIds,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesDonViHangNamProps) {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitAnnualAwardHistoryModalVisible, setUnitAnnualAwardHistoryModalVisible] =
    useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitAnnualAwards, setUnitAnnualAwards] = useState<any[]>([]);
  const [allUnitAnnualAwards, setAllUnitAnnualAwards] = useState<Record<string, any>>({});
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    if (selectedUnitIds.length > 0) {
      fetchUnitDetails();
    } else {
      setUnits([]);
      onTitleDataChange([]);
    }
  }, [selectedUnitIds]);

  const fetchUnitDetails = async () => {
    try {
      setLoading(true);
      const unitsRes = await apiClient.getMyUnits();

      if (unitsRes.success) {
        const unitsData = unitsRes.data || [];
        // Select units that are returned from /my-units
        const selectedUnits = unitsData.filter((unit: any) => selectedUnitIds.includes(unit.id));

        // If some selectedUnitIds are not present in my-units (e.g. co quan don vi ids), fetch them individually
        const missingIds = selectedUnitIds.filter(
          (id: string) => !selectedUnits.find((u: any) => u.id === id)
        );
        if (missingIds.length > 0) {
          const fetchedMissing: any[] = [];
          for (const mid of missingIds) {
            try {
              const res = await apiClient.getUnitById(mid);
              if (res.success && res.data) fetchedMissing.push(res.data);
            } catch (e) {
              // ignore missing unit
            }
          }
          // append fetched missing units
          selectedUnits.push(...fetchedMissing);
        }

        const formattedUnits: Unit[] = selectedUnits.map((unit: any) => ({
          id: unit.id,
          ten_don_vi: unit.ten_don_vi,
          ma_don_vi: unit.ma_don_vi,
          co_quan_don_vi_id: unit.co_quan_don_vi_id,
          CoQuanDonVi: unit.CoQuanDonVi || null,
        }));

        setUnits(formattedUnits);

        // Prefetch unit annual profiles for all selected units and store in a map
        try {
          const profilesMap: Record<string, any> = {};
          await Promise.all(
            formattedUnits.map(async unit => {
              try {
                const profileRes = await apiClient.getUnitAnnualProfile(unit.id, nam);
                if (profileRes.success && profileRes.data) {
                  profilesMap[unit.id] = profileRes.data;
                } else {
                  profilesMap[unit.id] = null;
                }
              } catch (e) {
                profilesMap[unit.id] = null;
              }
            })
          );
          console.log('Prefetched all unit annual profiles:', profilesMap);
          setAllUnitAnnualAwards(profilesMap);
        } catch (e) {
          // ignore prefetch errors
        }

        // Initialize title data if empty
        if (titleData.length === 0 && formattedUnits.length > 0) {
          const initialData: TitleData[] = formattedUnits.map((unit: Unit) => ({
            don_vi_id: unit.id,
            don_vi_type: (unit.co_quan_don_vi_id ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI') as
              | 'CO_QUAN_DON_VI'
              | 'DON_VI_TRUC_THUOC',
          }));
          onTitleDataChange(initialData);
        }
      }
    } catch (error) {
      console.error('Error fetching unit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDanhHieuType = () => {
    const selectedDanhHieus = titleData.map(item => item.danh_hieu).filter(Boolean);
    if (selectedDanhHieus.length === 0) return null;

    const hasDonVi = selectedDanhHieus.some(dh => dh === 'ĐVQT' || dh === 'ĐVTT');
    const hasBk = selectedDanhHieus.some(dh => dh === 'BKBQP' || dh === 'BKTTCP');

    if (hasDonVi) return 'donvi';
    if (hasBk) return 'bkbqp_bkttcp';
    return null;
  };

  const getDanhHieuOptions = (id: string) => {
    const selectedType = getSelectedDanhHieuType();
    let allOptions = [
      { label: 'Đơn vị Quyết thắng (ĐVQT)', value: 'ĐVQT' },
      { label: 'Đơn vị Tiên tiến (ĐVTT)', value: 'ĐVTT' },
      { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
      { label: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)', value: 'BKTTCP' },
    ];

    // Use prefetched annual profile for this unit to determine eligibility
    const profile = allUnitAnnualAwards[id];
    if (profile) {
      // profile.du_dieu_kien_bk_tong_cuc -> eligible for BKBQP (3 years)
      if (profile.du_dieu_kien_bk_tong_cuc === false) {
        allOptions = allOptions.filter(opt => opt.value !== 'BKBQP');
      }
      // profile.du_dieu_kien_bk_thu_tuong -> eligible for BKTTCP (5 years)
      if (profile.du_dieu_kien_bk_thu_tuong === false) {
        allOptions = allOptions.filter(opt => opt.value !== 'BKTTCP');
      }
    }

    if (selectedType === 'donvi') {
      return allOptions.filter(opt => opt.value === 'ĐVQT' || opt.value === 'ĐVTT');
    }

    if (selectedType === 'bkbqp_bkttcp') {
      return allOptions.filter(opt => opt.value === 'BKBQP' || opt.value === 'BKTTCP');
    }

    return allOptions;
  };

  const updateTitle = (id: string, field: string, value: any) => {
    const newData = [...titleData];
    const index = newData.findIndex(d => d.don_vi_id === id);
    if (index >= 0) {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      const unit = units.find(u => u.id === id);
      newData.push({
        don_vi_id: id,
        don_vi_type: unit?.co_quan_don_vi_id ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI',
        [field]: value,
      });
    }

    onTitleDataChange(newData);
  };

  const getTitleData = (id: string) => {
    return titleData.find(d => d.don_vi_id === id) || { don_vi_id: id };
  };

  const handleViewUnitHistory = async (record: Unit) => {
    setSelectedUnit(record);
    setLoadingModal(true);
    setUnitAnnualAwardHistoryModalVisible(true);

    try {
      // Fetch awards for history modal (separate from profile)
      const awardsRes = await apiClient.getUnitAnnualAwards(record.id, nam);
      if (awardsRes.success && awardsRes.data) {
        setUnitAnnualAwards(Array.isArray(awardsRes.data.awards) ? awardsRes.data.awards : []);
      } else {
        setUnitAnnualAwards([]);
      }
    } catch (error: any) {
      console.error('Error fetching unit awards:', error);
      setUnitAnnualAwards([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const columns: ColumnsType<Unit> = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Loại đơn vị',
      key: 'type',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const type = record.co_quan_don_vi_id ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI';
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
      width: 140,
      align: 'center',
      render: text => <Text code>{text}</Text>,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'ten_don_vi',
      key: 'ten_don_vi',
      width: 200,
      align: 'center',
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: (
        <span>
          Danh hiệu <Text type="danger">*</Text>
        </span>
      ),
      key: 'danh_hieu',
      width: 250,
      align: 'center',
      render: (_, record) => {
        const data = getTitleData(record.id);
        const availableOptions = getDanhHieuOptions(record.id);

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
          onClick={() => handleViewUnitHistory(record)}
          size="small"
        >
          Xem lịch sử
        </Button>
      ),
    },
  ];

  const allTitlesSet = units.every(u => {
    const data = getTitleData(u.id);
    return data.danh_hieu;
  });

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <div>
            <p>
              1. Chọn danh hiệu khen thưởng cho từng đơn vị đã chọn (<strong>{units.length}</strong>{' '}
              đơn vị)
            </p>
            <p>2. Đảm bảo tất cả đơn vị đều đã được chọn danh hiệu</p>
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
          Tổng số đơn vị: <strong>{units.length}</strong>
        </Text>
        <Text type={allTitlesSet ? 'success' : 'warning'}>
          Đã set danh hiệu:{' '}
          <strong>
            {titleData.filter(d => d.danh_hieu).length}/{units.length}
          </strong>
          {allTitlesSet && ' ✓'}
        </Text>
      </Space>

      <Table<Unit>
        columns={columns}
        dataSource={units}
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

      <UnitAnnualAwardHistoryModal
        visible={unitAnnualAwardHistoryModalVisible}
        unit={selectedUnit}
        awards={unitAnnualAwards}
        loading={loadingModal}
        onClose={() => {
          setUnitAnnualAwardHistoryModalVisible(false);
          setSelectedUnit(null);
          setUnitAnnualAwards([]);
        }}
      />
    </div>
  );
}
