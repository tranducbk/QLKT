'use client';

import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Alert, Typography, InputNumber, message } from 'antd';
import { SearchOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { formatDate } from '@/lib/utils';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  gioi_tinh?: string | null;
  co_quan_don_vi_id: string;
  don_vi_truc_thuoc_id: string;
  chuc_vu_id: string;
  cap_bac?: string;
  ngay_nhap_ngu?: string | Date | null;
  ngay_xuat_ngu?: string | Date | null;
  CoQuanDonVi?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
  };
  DonViTrucThuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    CoQuanDonVi?: {
      id: string;
      ten_don_vi: string;
      ma_don_vi: string;
    };
  };
  ChucVu?: {
    id: string;
    ten_chuc_vu: string;
  };
}

interface Step2SelectPersonnelKNCVSNXDProps {
  selectedPersonnelIds: string[];
  onPersonnelChange: (ids: string[]) => void;
  nam: number;
  onNamChange: (nam: number) => void;
}

export default function Step2SelectPersonnelKNCVSNXD({
  selectedPersonnelIds,
  onPersonnelChange,
  nam,
  onNamChange,
}: Step2SelectPersonnelKNCVSNXDProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [searchText, setSearchText] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [localNam, setLocalNam] = useState<number | null>(nam);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // Đồng bộ localNam với nam từ props
  useEffect(() => {
    setLocalNam(nam);
  }, [nam]);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/personnel', {
        params: {
          page: 1,
          limit: 1000,
        },
      });

      if (response.data.success) {
        const personnelData = response.data.data?.personnel || response.data.data || [];
        setPersonnel(personnelData);
        if (personnelData.length === 0) {
          message.warning('Không có quân nhân nào trong đơn vị của bạn.');
        }
      } else {
        message.error(response.data.message || 'Không thể lấy danh sách quân nhân');
      }
    } catch (error: any) {
      console.error('Error fetching personnel:', error);
      message.error(
        error?.response?.data?.message || error?.message || 'Lỗi khi tải danh sách quân nhân'
      );
    } finally {
      setLoading(false);
    }
  };

  const units = Array.from(
    new Set(
      personnel.map(p => {
        if (p.DonViTrucThuoc) {
          return `${p.DonViTrucThuoc.id}|${p.DonViTrucThuoc.ten_don_vi}`;
        } else if (p.CoQuanDonVi) {
          return `${p.CoQuanDonVi.id}|${p.CoQuanDonVi.ten_don_vi}`;
        }
        return '';
      })
    )
  ).filter(Boolean);

  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch =
      searchText === '' || p.ho_ten.toLowerCase().includes(searchText.toLowerCase());

    let matchesUnit = true;
    if (unitFilter !== 'ALL') {
      const unitId = unitFilter.split('|')[0];
      matchesUnit = p.don_vi_truc_thuoc_id === unitId || p.co_quan_don_vi_id === unitId;
    }

    return matchesSearch && matchesUnit;
  });

  const calculateTotalMonths = (
    ngayNhapNgu: string | Date | null | undefined,
    ngayXuatNgu: string | Date | null | undefined
  ) => {
    if (!ngayNhapNgu) return null;

    try {
      const startDate = typeof ngayNhapNgu === 'string' ? new Date(ngayNhapNgu) : ngayNhapNgu;
      const endDate = ngayXuatNgu
        ? typeof ngayXuatNgu === 'string'
          ? new Date(ngayXuatNgu)
          : ngayXuatNgu
        : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      let years = endDate.getFullYear() - startDate.getFullYear();
      let months = endDate.getMonth() - startDate.getMonth();
      let days = endDate.getDate() - startDate.getDate();

      if (days < 0) {
        months -= 1;
        const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
        days += lastDayOfPrevMonth;
      }

      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const totalMonths = years * 12 + months;
      const totalYears = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;

      return {
        years: totalYears,
        months: remainingMonths,
        totalMonths: totalMonths,
      };
    } catch {
      return null;
    }
  };

  // Kiểm tra quân nhân có đủ điều kiện đề xuất KNC_VSNXD_QDNDVN không
  const checkEligibleForKNCVSNXD = (record: Personnel): { eligible: boolean; reason?: string } => {
    // Kiểm tra giới tính
    if (!record.gioi_tinh || (record.gioi_tinh !== 'NAM' && record.gioi_tinh !== 'NU')) {
      return { eligible: false, reason: 'Chưa cập nhật giới tính' };
    }

    // Kiểm tra ngày nhập ngũ
    if (!record.ngay_nhap_ngu) {
      return { eligible: false, reason: 'Chưa cập nhật ngày nhập ngũ' };
    }

    // Tính số năm phục vụ
    const result = calculateTotalMonths(record.ngay_nhap_ngu, record.ngay_xuat_ngu);
    if (!result || result.years === 0) {
      return { eligible: false, reason: 'Chưa đủ thời gian phục vụ' };
    }

    // Yêu cầu: nữ >= 20 năm, nam >= 25 năm
    const requiredYears = record.gioi_tinh === 'NU' ? 20 : 25;
    if (result.years < requiredYears) {
      return {
        eligible: false,
        reason: `Chưa đủ ${requiredYears} năm phục vụ (hiện tại: ${result.years} năm)`,
      };
    }

    return { eligible: true };
  };

  const columns: ColumnsType<Personnel> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 300,
      align: 'center',
      render: (text, record) => {
        const donViTrucThuoc = record.DonViTrucThuoc?.ten_don_vi;
        const coQuanDonVi =
          record.CoQuanDonVi?.ten_don_vi || record.DonViTrucThuoc?.CoQuanDonVi?.ten_don_vi;
        const parts = [];
        if (donViTrucThuoc) parts.push(donViTrucThuoc);
        if (coQuanDonVi) parts.push(coQuanDonVi);
        const donViText = parts.length > 0 ? parts.join(', ') : '-';

        return (
          <div style={{ lineHeight: '1.5' }}>
            <div>
              <Text strong>{text}</Text>
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                {donViText}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Cấp bậc / Chức vụ',
      key: 'cap_bac_chuc_vu',
      width: 180,
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
      title: 'Giới tính',
      key: 'gioi_tinh',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (!record.gioi_tinh) {
          return <Text type="danger">Chưa cập nhật</Text>;
        }
        return <Text>{record.gioi_tinh === 'NAM' ? 'Nam' : 'Nữ'}</Text>;
      },
    },
    {
      title: 'Ngày nhập ngũ',
      key: 'ngay_nhap_ngu',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (!record.ngay_nhap_ngu) return <Text type="secondary">-</Text>;
        return formatDate(record.ngay_nhap_ngu);
      },
    },
    {
      title: 'Ngày xuất ngũ',
      key: 'ngay_xuat_ngu',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (!record.ngay_xuat_ngu) return <Text type="secondary">Chưa xuất ngũ</Text>;
        return formatDate(record.ngay_xuat_ngu);
      },
    },
    {
      title: 'Tổng tháng',
      key: 'tong_thang',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const result = calculateTotalMonths(record.ngay_nhap_ngu, record.ngay_xuat_ngu);
        if (!result) return <Text type="secondary">-</Text>;

        if (result.years > 0 && result.months > 0) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Text strong>{result.years} năm</Text>
              <Text type="secondary" style={{ fontSize: '12px', lineHeight: '1.2' }}>
                {result.months} tháng
              </Text>
            </div>
          );
        } else if (result.years > 0) {
          return <Text strong>{result.years} năm</Text>;
        } else if (result.totalMonths > 0) {
          return <Text strong>{result.totalMonths} tháng</Text>;
        } else {
          return <Text type="secondary">0 tháng</Text>;
        }
      },
    },
    {
      title: 'Đủ điều kiện',
      key: 'du_dieu_kien',
      width: 180,
      align: 'center',
      render: (_, record) => {
        const eligibility = checkEligibleForKNCVSNXD(record);
        if (eligibility.eligible) {
          return (
            <Text type="success" strong>
              ✓ Đủ điều kiện
            </Text>
          );
        } else {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="danger" strong>
                ✗ Không đủ
              </Text>
              <Text type="secondary" style={{ fontSize: '11px', textAlign: 'center' }}>
                {eligibility.reason}
              </Text>
            </div>
          );
        }
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedPersonnelIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      onPersonnelChange(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: Personnel) => {
      const eligibility = checkEligibleForKNCVSNXD(record);
      const isDisabled = !eligibility.eligible;

      return {
        disabled: isDisabled,
        title: isDisabled ? eligibility.reason || 'Không đủ điều kiện đề xuất' : '',
      };
    },
    onSelect: (record: Personnel, selected: boolean) => {
      if (selected) {
        const eligibility = checkEligibleForKNCVSNXD(record);
        if (!eligibility.eligible) {
          message.warning(
            `Quân nhân ${record.ho_ten} không đủ điều kiện: ${
              eligibility.reason || 'Không đủ điều kiện đề xuất'
            }.`
          );
          return false;
        }
      }
    },
  };

  return (
    <div>
      <Alert
        message="Bước 2: Chọn quân nhân - Kỷ niệm chương VSNXD QĐNDVN"
        description={
          <div>
            <p>1. Nhập năm đề xuất khen thưởng</p>
            <p>2. Chọn các quân nhân cần đề xuất khen thưởng từ danh sách dưới đây</p>
            <p>
              3. Bảng hiển thị thông tin ngày nhập ngũ, xuất ngũ và tổng tháng để hỗ trợ lựa chọn
            </p>
            <p>4. Sau khi chọn xong, nhấn &quot;Tiếp tục&quot; để sang bước chọn danh hiệu</p>
          </div>
        }
        type="info"
        showIcon
        icon={<TrophyOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Space style={{ marginBottom: 16 }} size="middle">
        <div>
          <Text strong>Năm đề xuất: </Text>
          <InputNumber
            value={localNam}
            onChange={value => {
              // Cho phép null/undefined để người dùng có thể xóa và nhập lại
              if (value === null || value === undefined) {
                setLocalNam(null);
                return;
              }

              const intValue = Math.floor(Number(value));

              // Nếu giá trị hợp lệ, cập nhật local state
              if (!isNaN(intValue)) {
                // Cho phép nhập bất kỳ số nào trong quá trình nhập (kể cả < 1900)
                // Chỉ giới hạn khi blur
                setLocalNam(intValue);
              }
            }}
            onBlur={e => {
              // Khi blur, đảm bảo giá trị trong khoảng hợp lệ và cập nhật lên parent
              const currentValue = localNam;
              if (currentValue === null || currentValue === undefined || currentValue < 1900) {
                const finalValue = 1900;
                setLocalNam(finalValue);
                onNamChange(finalValue);
              } else if (currentValue > 2999) {
                const finalValue = 2999;
                setLocalNam(finalValue);
                onNamChange(finalValue);
              } else {
                // Giá trị hợp lệ, cập nhật lên parent
                onNamChange(currentValue);
              }
            }}
            style={{ width: 150 }}
            size="large"
            min={1900}
            max={2999}
            placeholder="Nhập năm"
            controls={true}
            step={1}
            precision={0}
            keyboard={true}
          />
        </div>

        <Input
          placeholder="Tìm theo tên"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
          size="large"
          allowClear
        />

        <Select
          placeholder="Lọc theo đơn vị"
          value={unitFilter}
          onChange={setUnitFilter}
          style={{ width: 250 }}
          size="large"
          allowClear
        >
          <Select.Option value="ALL">Tất cả đơn vị</Select.Option>
          {units.map(unit => {
            const [id, name] = unit.split('|');
            return (
              <Select.Option key={id} value={unit}>
                {name}
              </Select.Option>
            );
          })}
        </Select>
      </Space>

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Tổng số quân nhân: <strong>{filteredPersonnel.length}</strong> | Đã chọn:{' '}
          <strong style={{ color: '#1890ff' }}>{selectedPersonnelIds.length}</strong>
        </Text>
      </div>

      {/* Cảnh báo về quân nhân không đủ điều kiện */}
      {(() => {
        const ineligiblePersonnel = filteredPersonnel.filter(
          p => !checkEligibleForKNCVSNXD(p).eligible
        );
        const ineligibleCount = ineligiblePersonnel.length;

        if (ineligibleCount > 0) {
          return (
            <Alert
              message="Cảnh báo"
              description={`Có ${ineligibleCount} quân nhân không đủ điều kiện đề xuất (yêu cầu: Nữ >= 20 năm, Nam >= 25 năm phục vụ). Vui lòng kiểm tra và cập nhật thông tin trước khi đề xuất.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          );
        }
        return null;
      })()}

      <Table
        columns={columns}
        dataSource={filteredPersonnel}
        rowKey="id"
        rowSelection={rowSelection}
        loading={loading}
        rowClassName={record => {
          // Tô màu dòng quân nhân không đủ điều kiện
          const eligibility = checkEligibleForKNCVSNXD(record);
          if (!eligibility.eligible) {
            return 'row-missing-gender';
          }
          return '';
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: total => `Tổng số ${total} quân nhân`,
        }}
        bordered
        locale={{
          emptyText: 'Không có dữ liệu quân nhân',
        }}
      />
    </div>
  );
}
