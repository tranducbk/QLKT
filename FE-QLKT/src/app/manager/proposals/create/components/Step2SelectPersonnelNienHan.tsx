'use client';

import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Alert, Typography, InputNumber, message } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  co_quan_don_vi_id: string;
  don_vi_truc_thuoc_id: string;
  chuc_vu_id: string;
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

interface Step2SelectPersonnelNienHanProps {
  selectedPersonnelIds: string[];
  onPersonnelChange: (ids: string[]) => void;
  nam: number;
  onNamChange: (nam: number) => void;
}

export default function Step2SelectPersonnelNienHan({
  selectedPersonnelIds,
  onPersonnelChange,
  nam,
  onNamChange,
}: Step2SelectPersonnelNienHanProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [searchText, setSearchText] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [localNam, setLocalNam] = useState<number | null>(nam);
  const [serviceProfilesMap, setServiceProfilesMap] = useState<Record<string, any>>({});

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

        // Fetch service profiles để biết quân nhân đã nhận hạng nào
        if (personnelData.length > 0) {
          await fetchServiceProfiles(personnelData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceProfiles = async (personnelList: Personnel[]) => {
    try {
      const profilesMap: Record<string, any> = {};

      // Fetch service profile cho mỗi quân nhân
      await Promise.all(
        personnelList.map(async p => {
          if (p.id) {
            try {
              const res = await apiClient.getServiceProfile(p.id);
              if (res.success && res.data) {
                profilesMap[p.id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
              profilesMap[p.id] = null;
            }
          }
        })
      );

      setServiceProfilesMap(profilesMap);
    } catch (error) {
      console.error('Error fetching service profiles:', error);
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

  // Kiểm tra điều kiện thời gian cho HCCSVV
  const checkHCCSVVEligibility = (record: Personnel) => {
    if (!record.ngay_nhap_ngu) return null;

    const result = calculateTotalMonths(record.ngay_nhap_ngu, record.ngay_xuat_ngu);
    if (!result) return null;

    const totalYears = result.years;
    const currentDate = new Date();
    const startDate =
      typeof record.ngay_nhap_ngu === 'string'
        ? new Date(record.ngay_nhap_ngu)
        : record.ngay_nhap_ngu;

    // Tính ngày đủ điều kiện cho từng hạng
    const eligibilityDateBa = new Date(startDate);
    eligibilityDateBa.setFullYear(eligibilityDateBa.getFullYear() + 10);
    const eligibilityYearBa = eligibilityDateBa.getFullYear();

    const eligibilityDateNhi = new Date(startDate);
    eligibilityDateNhi.setFullYear(eligibilityDateNhi.getFullYear() + 15);
    const eligibilityYearNhi = eligibilityDateNhi.getFullYear();

    const eligibilityDateNhat = new Date(startDate);
    eligibilityDateNhat.setFullYear(eligibilityDateNhat.getFullYear() + 20);
    const eligibilityYearNhat = eligibilityDateNhat.getFullYear();

    const currentYear = currentDate.getFullYear();

    return {
      hangBa: {
        eligible: currentYear >= eligibilityYearBa,
        yearsNeeded: Math.max(0, eligibilityYearBa - currentYear),
        totalYears,
      },
      hangNhi: {
        eligible: currentYear >= eligibilityYearNhi,
        yearsNeeded: Math.max(0, eligibilityYearNhi - currentYear),
        totalYears,
      },
      hangNhat: {
        eligible: currentYear >= eligibilityYearNhat,
        yearsNeeded: Math.max(0, eligibilityYearNhat - currentYear),
        totalYears,
      },
    };
  };

  // Kiểm tra quân nhân có thể đề xuất hạng tiếp theo không
  const canProposeNextRank = (record: Personnel) => {
    if (!record.ngay_nhap_ngu) return false;

    const eligibility = checkHCCSVVEligibility(record);
    if (!eligibility) return false;

    const serviceProfile = serviceProfilesMap[record.id];
    const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
    const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
    const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

    // Nếu chưa nhận Hạng Ba, chỉ có thể đề xuất nếu đủ 10 năm
    if (!hasHangBa) {
      return eligibility.hangBa.eligible;
    }

    // Nếu đã nhận Hạng Ba nhưng chưa nhận Hạng Nhì, chỉ có thể đề xuất nếu đủ 15 năm
    if (hasHangBa && !hasHangNhi) {
      return eligibility.hangNhi.eligible;
    }

    // Nếu đã nhận Hạng Nhì nhưng chưa nhận Hạng Nhất, chỉ có thể đề xuất nếu đủ 20 năm
    if (hasHangNhi && !hasHangNhat) {
      return eligibility.hangNhat.eligible;
    }

    // Nếu đã nhận tất cả hạng, không thể đề xuất nữa
    return false;
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
      title: 'Điều kiện HCCSVV',
      key: 'hccsvv_eligibility',
      width: 200,
      align: 'center',
      render: (_, record) => {
        const eligibility = checkHCCSVVEligibility(record);
        if (!eligibility) return <Text type="secondary">-</Text>;

        const serviceProfile = serviceProfilesMap[record.id];
        const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
        const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
        const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

        const { hangBa, hangNhi, hangNhat } = eligibility;

        // Chưa đủ 10 năm
        if (!hangBa.eligible) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="warning" strong>
                Chưa đủ 10 năm
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Còn {hangBa.yearsNeeded} năm
              </Text>
            </div>
          );
        }

        // Đủ 10 năm nhưng chưa nhận Hạng Ba → chỉ được đề xuất Hạng Ba
        if (hangBa.eligible && !hasHangBa) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="success" strong>
                Đủ Hạng Ba
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Có thể đề xuất Hạng Ba
              </Text>
            </div>
          );
        }

        // Đã nhận Hạng Ba, đủ 15 năm nhưng chưa nhận Hạng Nhì → có thể đề xuất Hạng Nhì
        if (hasHangBa && hangNhi.eligible && !hasHangNhi) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="success" strong>
                Đủ Hạng Nhì
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Có thể đề xuất Hạng Nhì
              </Text>
            </div>
          );
        }

        // Đã nhận Hạng Ba, chưa đủ 15 năm
        if (hasHangBa && !hangNhi.eligible) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="success" strong>
                Đã nhận Hạng Ba
              </Text>
              <Text type="warning" style={{ fontSize: '11px' }}>
                Chưa đủ 15 năm (Hạng Nhì)
              </Text>
            </div>
          );
        }

        // Đã nhận Hạng Nhì, đủ 20 năm nhưng chưa nhận Hạng Nhất → có thể đề xuất Hạng Nhất
        if (hasHangNhi && hangNhat.eligible && !hasHangNhat) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="success" strong>
                Đủ Hạng Nhất
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Có thể đề xuất Hạng Nhất
              </Text>
            </div>
          );
        }

        // Đã nhận Hạng Nhì, chưa đủ 20 năm
        if (hasHangNhi && !hangNhat.eligible) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Text type="success" strong>
                Đã nhận Hạng Nhì
              </Text>
              <Text type="warning" style={{ fontSize: '11px' }}>
                Chưa đủ 20 năm (Hạng Nhất)
              </Text>
            </div>
          );
        }

        // Đã nhận tất cả hạng
        if (hasHangNhat) {
          return (
            <Text type="success" strong>
              Đã nhận đủ tất cả hạng
            </Text>
          );
        }

        return <Text type="secondary">-</Text>;
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedPersonnelIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      onPersonnelChange(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: Personnel) => {
      const missingNgayNhapNgu = !record.ngay_nhap_ngu;
      const canPropose = canProposeNextRank(record);

      let title = '';
      if (missingNgayNhapNgu) {
        title = 'Quân nhân này chưa cập nhật ngày nhập ngũ. Vui lòng cập nhật trước khi đề xuất.';
      } else if (!canPropose) {
        const eligibility = checkHCCSVVEligibility(record);
        const serviceProfile = serviceProfilesMap[record.id];
        const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
        const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
        const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

        if (!hasHangBa && eligibility && !eligibility.hangBa.eligible) {
          title = `Chưa đủ 10 năm để đề xuất Hạng Ba. Còn ${eligibility.hangBa.yearsNeeded} năm.`;
        } else if (hasHangBa && !hasHangNhi && eligibility && !eligibility.hangNhi.eligible) {
          title = `Chưa đủ 15 năm để đề xuất Hạng Nhì. Còn ${eligibility.hangNhi.yearsNeeded} năm.`;
        } else if (hasHangNhi && !hasHangNhat && eligibility && !eligibility.hangNhat.eligible) {
          title = `Chưa đủ 20 năm để đề xuất Hạng Nhất. Còn ${eligibility.hangNhat.yearsNeeded} năm.`;
        } else if (hasHangNhat) {
          title = 'Quân nhân này đã nhận đủ tất cả hạng HCCSVV.';
        }
      }

      return {
        disabled: missingNgayNhapNgu || !canPropose,
        title,
      };
    },
    onSelect: (record: Personnel, selected: boolean) => {
      if (selected) {
        if (!record.ngay_nhap_ngu) {
        message.warning(
          `Quân nhân ${record.ho_ten} chưa cập nhật ngày nhập ngũ. Vui lòng cập nhật trước khi đề xuất.`
        );
        return false;
        }
        if (!canProposeNextRank(record)) {
          const eligibility = checkHCCSVVEligibility(record);
          const serviceProfile = serviceProfilesMap[record.id];
          const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
          const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
          const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

          if (!hasHangBa && eligibility && !eligibility.hangBa.eligible) {
            message.warning(
              `Quân nhân ${record.ho_ten} chưa đủ 10 năm để đề xuất Hạng Ba. Còn ${eligibility.hangBa.yearsNeeded} năm.`
            );
          } else if (hasHangBa && !hasHangNhi && eligibility && !eligibility.hangNhi.eligible) {
            message.warning(
              `Quân nhân ${record.ho_ten} chưa đủ 15 năm để đề xuất Hạng Nhì. Còn ${eligibility.hangNhi.yearsNeeded} năm.`
            );
          } else if (hasHangNhi && !hasHangNhat && eligibility && !eligibility.hangNhat.eligible) {
            message.warning(
              `Quân nhân ${record.ho_ten} chưa đủ 20 năm để đề xuất Hạng Nhất. Còn ${eligibility.hangNhat.yearsNeeded} năm.`
            );
          } else if (hasHangNhat) {
            message.warning(`Quân nhân ${record.ho_ten} đã nhận đủ tất cả hạng HCCSVV.`);
          }
          return false;
        }
      }
    },
  };

  return (
    <div>
      <Alert
        message="Bước 2: Chọn quân nhân - Niên hạn"
        description={
          <div>
            <p>1. Nhập năm đề xuất khen thưởng</p>
            <p>2. Chọn các quân nhân cần đề xuất khen thưởng niên hạn từ danh sách dưới đây</p>
            <p>
              3. Bảng hiển thị thông tin ngày nhập ngũ, xuất ngũ và tổng tháng để hỗ trợ lựa chọn
            </p>
            <p>4. Sau khi chọn xong, nhấn &quot;Tiếp tục&quot; để sang bước chọn danh hiệu</p>
          </div>
        }
        type="info"
        showIcon
        icon={<TeamOutlined />}
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

      {/* Cảnh báo về quân nhân chưa có ngày nhập ngũ */}
      {(() => {
        const missingNgayNhapNguCount = filteredPersonnel.filter(p => !p.ngay_nhap_ngu).length;

        if (missingNgayNhapNguCount > 0) {
          return (
            <Alert
              message="Cảnh báo"
              description={`Có ${missingNgayNhapNguCount} quân nhân chưa cập nhật ngày nhập ngũ. Vui lòng cập nhật trước khi đề xuất.`}
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
          // Tô màu dòng quân nhân chưa có ngày nhập ngũ
          if (!record.ngay_nhap_ngu) {
            return 'row-missing-ngay-nhap-ngu';
          }

          // Chỉ tô màu nếu chưa đủ điều kiện cho hạng tiếp theo
          if (!canProposeNextRank(record)) {
            const eligibility = checkHCCSVVEligibility(record);
            const serviceProfile = serviceProfilesMap[record.id];
            const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
            const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
            const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

            // Nếu chưa nhận Hạng Ba và chưa đủ 10 năm
            if (!hasHangBa && eligibility && !eligibility.hangBa.eligible) {
              return 'row-not-eligible-hccsvv';
          }
            // Nếu đã nhận Hạng Ba nhưng chưa nhận Hạng Nhì và chưa đủ 15 năm
            if (hasHangBa && !hasHangNhi && eligibility && !eligibility.hangNhi.eligible) {
              return 'row-partial-eligible-hccsvv';
            }
            // Nếu đã nhận Hạng Nhì nhưng chưa nhận Hạng Nhất và chưa đủ 20 năm
            if (hasHangNhi && !hasHangNhat && eligibility && !eligibility.hangNhat.eligible) {
              return 'row-partial-eligible-hccsvv';
            }
            // Nếu đã nhận tất cả hạng
            if (hasHangNhat) {
              return 'row-not-eligible-hccsvv';
            }
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
