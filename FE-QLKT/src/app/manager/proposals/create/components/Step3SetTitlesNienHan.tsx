'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Alert, Typography, Space, message, Button } from 'antd';
import { EditOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';
import ServiceHistoryModal from './ServiceHistoryModal';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  ngay_sinh?: string | null;
  cap_bac?: string;
  ngay_nhap_ngu?: string | Date | null;
  ngay_xuat_ngu?: string | Date | null;
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

interface Step3SetTitlesNienHanProps {
  selectedPersonnelIds: string[];
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitlesNienHan({
  selectedPersonnelIds,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesNienHanProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [serviceProfilesMap, setServiceProfilesMap] = useState<Record<string, any>>({});
  const [serviceHistoryModalVisible, setServiceHistoryModalVisible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [serviceProfile, setServiceProfile] = useState<any>(null);
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

      // Fetch service profiles để biết quân nhân đã nhận hạng nào
      if (personnelData.length > 0) {
        await fetchServiceProfiles(personnelData);
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

  const fetchServiceProfiles = async (personnelList: Personnel[]) => {
    try {
      const profilesMap: Record<string, any> = {};

      await Promise.all(
        personnelList.map(async p => {
          if (p.id) {
            try {
              const res = await apiClient.getServiceProfile(p.id);
              if (res.success && res.data) {
                profilesMap[p.id] = res.data;
              }
            } catch (error) {
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
  const checkHCCSVVEligibilityForPersonnel = (record: Personnel) => {
    if (!record.ngay_nhap_ngu) return null;

    const result = calculateTotalMonths(record.ngay_nhap_ngu, record.ngay_xuat_ngu);
    if (!result) return null;

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
      hangBa: currentYear >= eligibilityYearBa,
      hangNhi: currentYear >= eligibilityYearNhi,
      hangNhat: currentYear >= eligibilityYearNhat,
    };
  };

  const getDanhHieuOptions = () => {
    return [
      { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba', value: 'HCCSVV_HANG_BA' },
      { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì', value: 'HCCSVV_HANG_NHI' },
      { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất', value: 'HCCSVV_HANG_NHAT' },
    ];
  };

  const updateTitle = async (id: string, field: string, value: any) => {
    // Validation cho NIEN_HAN: Kiểm tra điều kiện thời gian cho HCCSVV
    if (field === 'danh_hieu' && value) {
      const personnelRecord = personnel.find(p => p.id === id);
      if (personnelRecord) {
        const eligibility = checkHCCSVVEligibilityForPersonnel(personnelRecord);
        if (eligibility) {
          // Kiểm tra logic thứ bậc: Phải đủ Hạng Ba trước, sau đó mới có Hạng Nhì, rồi mới có Hạng Nhất
          if (value === 'HCCSVV_HANG_NHI') {
            if (!eligibility.hangBa) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Ba (10 năm). ` +
                  `Không thể đề xuất Hạng Nhì (15 năm) khi chưa đủ Hạng Ba.`
              );
              return;
            }
            if (!eligibility.hangNhi) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Nhì (15 năm). ` +
                  `Vui lòng kiểm tra lại thời gian phục vụ.`
              );
              return;
            }
          } else if (value === 'HCCSVV_HANG_NHAT') {
            if (!eligibility.hangBa) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Ba (10 năm). ` +
                  `Không thể đề xuất Hạng Nhất (20 năm) khi chưa đủ Hạng Ba.`
              );
              return;
            }
            if (!eligibility.hangNhi) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Nhì (15 năm). ` +
                  `Không thể đề xuất Hạng Nhất (20 năm) khi chưa đủ Hạng Nhì.`
              );
              return;
            }
            if (!eligibility.hangNhat) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Nhất (20 năm). ` +
                  `Vui lòng kiểm tra lại thời gian phục vụ.`
              );
              return;
            }
          } else if (value === 'HCCSVV_HANG_BA') {
            if (!eligibility.hangBa) {
              message.error(
                `Quân nhân "${personnelRecord.ho_ten}" chưa đủ điều kiện Hạng Ba (10 năm). ` +
                  `Vui lòng kiểm tra lại thời gian phục vụ.`
              );
              return;
            }
          }
        } else {
          message.error(
            `Quân nhân "${personnelRecord.ho_ten}" chưa có thông tin ngày nhập ngũ. ` +
              `Vui lòng cập nhật thông tin ngày nhập ngũ trước khi đề xuất.`
          );
          return;
        }
      }

      // Kiểm tra thứ tự hạng (phải nhận từ thấp lên cao)
      if (personnelRecord) {
        const serviceProfile = serviceProfilesMap[id];
        const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
        const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
        const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

        if (value === 'HCCSVV_HANG_NHI' && !hasHangBa) {
          message.error(`${personnelRecord.ho_ten}: Phải nhận Hạng Ba trước khi đề xuất Hạng Nhì.`);
          return;
        }

        if (value === 'HCCSVV_HANG_NHAT' && !hasHangNhi) {
          message.error(
            `${personnelRecord.ho_ten}: Phải nhận Hạng Nhì trước khi đề xuất Hạng Nhất.`
          );
          return;
        }

        // Kiểm tra nếu đã nhận hạng rồi thì không cho đề xuất lại
        if (value === 'HCCSVV_HANG_BA' && hasHangBa) {
          message.warning(`${personnelRecord.ho_ten}: Đã nhận Hạng Ba rồi.`);
          return;
        }

        if (value === 'HCCSVV_HANG_NHI' && hasHangNhi) {
          message.warning(`${personnelRecord.ho_ten}: Đã nhận Hạng Nhì rồi.`);
          return;
        }

        if (value === 'HCCSVV_HANG_NHAT' && hasHangNhat) {
          message.warning(`${personnelRecord.ho_ten}: Đã nhận Hạng Nhất rồi.`);
          return;
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
    setServiceHistoryModalVisible(true);

    try {
      const profileRes = await apiClient.getServiceProfile(record.id);
      if (profileRes.success && profileRes.data) {
        setServiceProfile(profileRes.data);
      } else {
        setServiceProfile(null);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      message.error('Không thể tải lịch sử niên hạn');
      setServiceProfile(null);
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
      render: (date: string | undefined | null) =>
        date ? new Date(date).toLocaleDateString() : '-',
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
      title: 'Tổng tháng',
      key: 'tong_thang',
      width: 150,
      align: 'center',
      render: (_: any, record: Personnel) => {
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

        // Lọc danh hiệu dựa trên điều kiện thời gian và hạng đã nhận cho HCCSVV
        // Logic: Phải nhận từ thấp lên cao: Hạng Ba → Hạng Nhì → Hạng Nhất
        const eligibility = checkHCCSVVEligibilityForPersonnel(record);
        const serviceProfile = serviceProfilesMap[record.id];

        // Kiểm tra quân nhân đã nhận hạng nào
        const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
        const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
        const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

        let availableOptions = getDanhHieuOptions();
        if (eligibility) {
          availableOptions = availableOptions.filter(option => {
            if (option.value === 'HCCSVV_HANG_BA') {
              // Hạng Ba: cần đủ 10 năm VÀ chưa nhận Hạng Ba
              return eligibility.hangBa && !hasHangBa;
            } else if (option.value === 'HCCSVV_HANG_NHI') {
              // Hạng Nhì: phải đã nhận Hạng Ba VÀ đủ 15 năm VÀ chưa nhận Hạng Nhì
              return hasHangBa && eligibility.hangBa && eligibility.hangNhi && !hasHangNhi;
            } else if (option.value === 'HCCSVV_HANG_NHAT') {
              // Hạng Nhất: phải đã nhận Hạng Nhì VÀ đủ 20 năm VÀ chưa nhận Hạng Nhất
              return (
                hasHangNhi &&
                eligibility.hangBa &&
                eligibility.hangNhi &&
                eligibility.hangNhat &&
                !hasHangNhat
              );
            }
            return true;
          });
        } else {
          // Nếu không có ngày nhập ngũ, không cho chọn hạng nào
          availableOptions = [];
        }

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
              2. <strong>Yêu cầu thời gian:</strong> Hạng Ba: 10 năm, Hạng Nhì: 15 năm, Hạng Nhất:
              20 năm
            </p>
            <p>
              3. <strong>Lưu ý:</strong> Phải nhận từ thấp lên cao: Hạng Ba → Hạng Nhì → Hạng Nhất
            </p>
            <p>4. Đảm bảo tất cả quân nhân đều đã được chọn danh hiệu</p>
            <p>5. Sau khi hoàn tất, nhấn &quot;Tiếp tục&quot; để sang bước upload file</p>
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

      <ServiceHistoryModal
        visible={serviceHistoryModalVisible}
        personnel={selectedPersonnel}
        serviceProfile={serviceProfile}
        loading={loadingModal}
        onClose={() => {
          setServiceHistoryModalVisible(false);
          setSelectedPersonnel(null);
          setServiceProfile(null);
        }}
      />
    </div>
  );
}
