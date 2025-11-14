'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Input, Alert, Typography, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';

const { Text } = Typography;
const { TextArea } = Input;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  CoQuanDonVi?: {
    ten_don_vi: string;
  };
  DonViTrucThuoc?: {
    ten_don_vi: string;
  };
}

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
  personnel_id?: string;
  don_vi_id?: string;
  don_vi_type?: 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC';
  danh_hieu?: string;
  loai?: 'NCKH' | 'SKKH';
  mo_ta?: string;
}

interface Step3SetTitlesProps {
  selectedPersonnelIds: string[];
  selectedUnitIds?: string[];
  proposalType: string;
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
}

export default function Step3SetTitles({
  selectedPersonnelIds,
  selectedUnitIds = [],
  proposalType,
  titleData,
  onTitleDataChange,
}: Step3SetTitlesProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Fetch personnel/unit details
  useEffect(() => {
    if (proposalType === 'DON_VI_HANG_NAM') {
      if (selectedUnitIds.length > 0) {
        fetchUnitDetails();
      } else {
        // Reset units nếu không có đơn vị nào được chọn
        setUnits([]);
        onTitleDataChange([]);
      }
    } else {
      if (selectedPersonnelIds.length > 0) {
        fetchPersonnelDetails();
      } else {
        // Reset personnel nếu không có quân nhân nào được chọn
        setPersonnel([]);
        onTitleDataChange([]);
      }
    }
  }, [selectedPersonnelIds, selectedUnitIds, proposalType]);

  const fetchPersonnelDetails = async () => {
    try {
      setLoading(true);
      const promises = selectedPersonnelIds.map((id) => axiosInstance.get(`/api/personnel/${id}`));
      const responses = await Promise.all(promises);
      const personnelData = responses
        .filter((r) => r.data.success)
        .map((r) => r.data.data);
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

  const fetchUnitDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching unit details for selectedUnitIds:', selectedUnitIds);
      
      // Gọi API để lấy đơn vị của Manager
      const unitsRes = await apiClient.getMyUnits();
      console.log('Units API response:', unitsRes);
      
      if (unitsRes.success) {
        const unitsData = unitsRes.data || [];
        console.log('All manager units:', unitsData);
        
        // Lọc các đơn vị đã chọn
        const selectedUnits = unitsData.filter((unit: any) => selectedUnitIds.includes(unit.id));
        console.log('Selected units:', selectedUnits);
        
        const formattedUnits: Unit[] = selectedUnits.map((unit: any) => ({
          id: unit.id,
          ten_don_vi: unit.ten_don_vi,
          ma_don_vi: unit.ma_don_vi,
          co_quan_don_vi_id: unit.co_quan_don_vi_id,
          CoQuanDonVi: unit.CoQuanDonVi || null,
        }));
        
        console.log('Formatted units:', formattedUnits);
        setUnits(formattedUnits);

        // Initialize title data if empty
        if (titleData.length === 0 && formattedUnits.length > 0) {
          const initialData: TitleData[] = formattedUnits.map((unit: Unit) => ({
            don_vi_id: unit.id,
            don_vi_type: (unit.co_quan_don_vi_id ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI') as 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC',
          }));
          console.log('Initial title data:', initialData);
          onTitleDataChange(initialData);
        }
      } else {
        console.error('Failed to fetch units:', unitsRes.message);
      }
    } catch (error) {
      console.error('Error fetching unit details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get danh hiệu options based on proposal type
  const getDanhHieuOptions = () => {
    switch (proposalType) {
      case 'CA_NHAN_HANG_NAM':
        return [
          { label: 'Chiến sĩ thi đua cơ sở (CSTDCS)', value: 'CSTDCS' },
          { label: 'Chiến sĩ tiên tiến (CSTT)', value: 'CSTT' },
          { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
          { label: 'Chiến sĩ thi đua toàn quân (CSTDTQ)', value: 'CSTDTQ' },
        ];
      case 'DON_VI_HANG_NAM':
        return [
          { label: 'Đơn vị Quyết thắng (ĐVQT)', value: 'ĐVQT' },
          { label: 'Đơn vị Tiên tiến (ĐVTT)', value: 'ĐVTT' },
          { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
          { label: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)', value: 'BKTTCP' },
        ];
      case 'NIEN_HAN':
        return [
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba', value: 'HCCSVV_HANG_BA' },
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì', value: 'HCCSVV_HANG_NHI' },
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất', value: 'HCCSVV_HANG_NHAT' },
        ];
      case 'CONG_HIEN':
        return [
          { label: 'Huân chương Bảo vệ Tổ quốc Hạng Ba', value: 'HCBVTQ_HANG_BA' },
          { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì', value: 'HCBVTQ_HANG_NHI' },
          { label: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất', value: 'HCBVTQ_HANG_NHAT' },
        ];
      default:
        return [];
    }
  };

  // Update title for a personnel/unit
  const updateTitle = (id: string, field: string, value: any) => {
    const newData = [...titleData];
    let index: number;
    
    if (proposalType === 'DON_VI_HANG_NAM') {
      index = newData.findIndex((d) => d.don_vi_id === id);
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
    } else {
      index = newData.findIndex((d) => d.personnel_id === id);
      if (index >= 0) {
        newData[index] = { ...newData[index], [field]: value };
      } else {
        newData.push({ personnel_id: id, [field]: value });
      }
    }

    onTitleDataChange(newData);
  };

  // Get title data for a personnel/unit
  const getTitleData = (id: string) => {
    if (proposalType === 'DON_VI_HANG_NAM') {
      return titleData.find((d) => d.don_vi_id === id) || { don_vi_id: id };
    }
    return titleData.find((d) => d.personnel_id === id) || { personnel_id: id };
  };

  // Check if all personnel/units have titles set
  const allTitlesSet = proposalType === 'DON_VI_HANG_NAM'
    ? units.every((u) => {
        const data = getTitleData(u.id);
        return data.danh_hieu;
      })
    : personnel.every((p) => {
        const data = getTitleData(p.id);
        if (proposalType === 'NCKH') {
          return data.loai && data.mo_ta;
        } else {
          return data.danh_hieu;
        }
      });

  // Columns for DON_VI_HANG_NAM
  const unitColumns: ColumnsType<Unit> = [
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
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'ten_don_vi',
      key: 'ten_don_vi',
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: (
        <span>
          Danh hiệu <Text type="danger">*</Text>
        </span>
      ),
      key: 'danh_hieu',
      width: 250,
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <Select
            value={data.danh_hieu}
            onChange={(value) => updateTitle(record.id, 'danh_hieu', value)}
            placeholder="Chọn danh hiệu"
            style={{ width: '100%' }}
            size="middle"
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { minWidth: 'max-content' } } }}
            options={getDanhHieuOptions()}
          />
        );
      },
    },
  ];

  // Columns for CA_NHAN_HANG_NAM, NIEN_HAN, CONG_HIEN
  const standardColumns: ColumnsType<Personnel> = [
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
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cơ quan đơn vị',
      key: 'co_quan_don_vi',
      width: 140,
      render: (_, record) => record.CoQuanDonVi?.ten_don_vi || '-',
    },
    {
      title: 'Đơn vị trực thuộc',
      key: 'don_vi_truc_thuoc',
      width: 140,
      render: (_, record) => record.DonViTrucThuoc?.ten_don_vi || '-',
    },
    {
      title: (
        <span>
          Danh hiệu <Text type="danger">*</Text>
        </span>
      ),
      key: 'danh_hieu',
      width: 200,
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <Select
            value={data.danh_hieu}
            onChange={(value) => updateTitle(record.id, 'danh_hieu', value)}
            placeholder="Chọn danh hiệu"
            style={{ width: '100%' }}
            size="middle"
            options={getDanhHieuOptions()}
          />
        );
      },
    },
  ];

  // Columns for NCKH
  const nckhColumns: ColumnsType<Personnel> = [
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
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cơ quan đơn vị',
      key: 'co_quan_don_vi',
      width: 140,
      render: (_, record) => record.CoQuanDonVi?.ten_don_vi || '-',
    },
    {
      title: 'Đơn vị trực thuộc',
      key: 'don_vi_truc_thuoc',
      width: 150,
      render: (_, record) => record.DonViTrucThuoc?.ten_don_vi || '-',
    },
    {
      title: (
        <span>
          Loại <Text type="danger">*</Text>
        </span>
      ),
      key: 'loai',
      width: 160,
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <Select
            value={data.loai}
            onChange={(value) => updateTitle(record.id, 'loai', value)}
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
      render: (_, record) => {
        const data = getTitleData(record.id);
        return (
          <TextArea
            value={data.mo_ta}
            onChange={(e) => updateTitle(record.id, 'mo_ta', e.target.value)}
            placeholder="Nhập mô tả chi tiết về đề tài hoặc thành tích..."
            rows={1}
            maxLength={500}
            showCount
            style={{ fontSize: '14px' }}
          />
        );
      },
    },
  ];

  const columns =
    proposalType === 'NCKH'
      ? nckhColumns
      : proposalType === 'DON_VI_HANG_NAM'
        ? unitColumns
        : standardColumns;

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <div>
            <p>
              1. Chọn danh hiệu khen thưởng cho{' '}
              {proposalType === 'DON_VI_HANG_NAM' ? (
                <>
                  từng đơn vị đã chọn (<strong>{units.length}</strong> đơn vị)
                </>
              ) : (
                <>
                  từng quân nhân đã chọn (<strong>{personnel.length}</strong> quân nhân)
                </>
              )}
            </p>
            <p>
              2. Đảm bảo tất cả{' '}
              {proposalType === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'quân nhân'} đều đã được chọn danh
              hiệu
            </p>
            <p>3. Sau khi hoàn tất, nhấn &quot;Tiếp tục&quot; để sang bước upload file</p>
          </div>
        }
        type="info"
        showIcon
        icon={<EditOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Summary */}
      <Space direction="vertical" style={{ marginBottom: 16, width: '100%' }} size="small">
        <Text type="secondary">
          Tổng số {proposalType === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'quân nhân'}:{' '}
          <strong>{proposalType === 'DON_VI_HANG_NAM' ? units.length : personnel.length}</strong>
        </Text>
        <Text type={allTitlesSet ? 'success' : 'warning'}>
          Đã set danh hiệu:{' '}
          <strong>
            {titleData.filter((d) => {
              if (proposalType === 'NCKH') {
                return d.loai && d.mo_ta;
              }
              return d.danh_hieu;
            }).length}
            /{proposalType === 'DON_VI_HANG_NAM' ? units.length : personnel.length}
          </strong>
          {allTitlesSet && ' ✓'}
        </Text>
      </Space>

      {/* Table */}
      {proposalType === 'DON_VI_HANG_NAM' ? (
        <Table<Unit>
          columns={unitColumns}
          dataSource={units}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          bordered
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'Không có dữ liệu',
          }}
        />
      ) : (
        <Table<Personnel>
          columns={proposalType === 'NCKH' ? nckhColumns : standardColumns}
          dataSource={personnel}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          bordered
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'Không có dữ liệu',
          }}
        />
      )}
    </div>
  );
}
