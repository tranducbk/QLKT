'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Select,
  Input,
  Alert,
  Typography,
  Space,
  Tag,
  message,
  Modal,
  Button,
  Tabs,
} from 'antd';
import { EditOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';
import PersonnelRewardHistoryModal from './PersonnelRewardHistoryModal';
import ServiceHistoryModal from './ServiceHistoryModal';
import PositionHistoryModal from './PositionHistoryModal';
import ScientificAchievementHistoryModal from './ScientificAchievementHistoryModal';
import UnitAnnualAwardHistoryModal from './UnitAnnualAwardHistoryModal';

const { Text } = Typography;
const { TextArea } = Input;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  gioi_tinh?: string | null;
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

interface Step3SetTitlesProps {
  selectedPersonnelIds: string[];
  selectedUnitIds?: string[];
  proposalType: string;
  titleData: TitleData[];
  onTitleDataChange: (data: TitleData[]) => void;
  nam: number;
}

export default function Step3SetTitles({
  selectedPersonnelIds,
  selectedUnitIds = [],
  proposalType,
  titleData,
  onTitleDataChange,
  nam,
}: Step3SetTitlesProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [positionHistoriesMap, setPositionHistoriesMap] = useState<Record<string, any[]>>({});
  const [serviceProfilesMap, setServiceProfilesMap] = useState<Record<string, any>>({});

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [serviceHistoryModalVisible, setServiceHistoryModalVisible] = useState(false);
  const [positionHistoryModalVisible, setPositionHistoryModalVisible] = useState(false);
  const [scientificAchievementHistoryModalVisible, setScientificAchievementHistoryModalVisible] =
    useState(false);
  const [unitAnnualAwardHistoryModalVisible, setUnitAnnualAwardHistoryModalVisible] =
    useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [annualProfile, setAnnualProfile] = useState<any>(null);
  const [serviceProfile, setServiceProfile] = useState<any>(null);
  const [positionHistory, setPositionHistory] = useState<any[]>([]);
  const [scientificAchievements, setScientificAchievements] = useState<any[]>([]);
  const [unitAnnualAwards, setUnitAnnualAwards] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

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
      const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
      const responses = await Promise.all(promises);
      const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);
      setPersonnel(personnelData);

      // Nếu là đề xuất cống hiến, fetch lịch sử chức vụ
      if (proposalType === 'CONG_HIEN' && personnelData.length > 0) {
        await fetchPositionHistories(personnelData);
      }

      // Nếu là đề xuất niên hạn, fetch service profiles để biết quân nhân đã nhận hạng nào
      if (proposalType === 'NIEN_HAN' && personnelData.length > 0) {
        await fetchServiceProfiles(personnelData);
      }

      // Initialize title data if empty
      if (titleData.length === 0) {
        const initialData = personnelData.map((p: Personnel) => {
          const data: TitleData = {
            personnel_id: p.id,
          };

          // Tự động set danh hiệu cho các loại đề xuất chỉ có 1 lựa chọn
          if (proposalType === 'KNC_VSNXD_QDNDVN') {
            data.danh_hieu = 'KNC_VSNXD_QDNDVN';
          } else if (proposalType === 'HC_QKQT') {
            data.danh_hieu = 'HC_QKQT';
          }

          return data;
        });
        onTitleDataChange(initialData);
      } else {
        // Nếu đã có titleData nhưng chưa có danh_hieu cho KNC_VSNXD_QDNDVN hoặc HC_QKQT, tự động set
        if (proposalType === 'KNC_VSNXD_QDNDVN' || proposalType === 'HC_QKQT') {
          const updatedData = titleData.map(item => {
            if (!item.danh_hieu) {
              return {
                ...item,
                danh_hieu: proposalType === 'KNC_VSNXD_QDNDVN' ? 'KNC_VSNXD_QDNDVN' : 'HC_QKQT',
              };
            }
            return item;
          });
          onTitleDataChange(updatedData);
        }
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

      // Fetch lịch sử chức vụ cho mỗi quân nhân
      await Promise.all(
        personnelList.map(async p => {
          if (p.id) {
            try {
              const res = await apiClient.getPositionHistory(p.id);
              if (res.success && res.data) {
                historiesMap[p.id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
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
  const checkEligibleForRank = (
    personnelId: string,
    rank: 'HANG_NHAT' | 'HANG_NHI' | 'HANG_BA'
  ): boolean => {
    const months0_9_1_0 = getTotalMonthsByGroup(personnelId, '0.9-1.0');
    const months0_8 = getTotalMonthsByGroup(personnelId, '0.8');
    const months0_7 = getTotalMonthsByGroup(personnelId, '0.7');

    const requiredMonths = 10 * 12; // 10 năm = 120 tháng

    if (rank === 'HANG_NHAT') {
      // Hạng nhất: cần >= 10 năm từ nhóm 0.9-1.0
      return months0_9_1_0 >= requiredMonths;
    } else if (rank === 'HANG_NHI') {
      // Hạng nhì: cần >= 10 năm từ nhóm 0.8 + 0.9-1.0 (hạng cao cộng vào)
      return months0_8 + months0_9_1_0 >= requiredMonths;
    } else if (rank === 'HANG_BA') {
      // Hạng ba: cần >= 10 năm từ nhóm 0.7 + 0.8 + 0.9-1.0 (tất cả hạng cao cộng vào)
      return months0_7 + months0_8 + months0_9_1_0 >= requiredMonths;
    }

    return false;
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
            don_vi_type: (unit.co_quan_don_vi_id ? 'DON_VI_TRUC_THUOC' : 'CO_QUAN_DON_VI') as
              | 'CO_QUAN_DON_VI'
              | 'DON_VI_TRUC_THUOC',
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
  // Xác định loại danh hiệu đã được chọn trong đề xuất
  const getSelectedDanhHieuType = () => {
    if (proposalType !== 'CA_NHAN_HANG_NAM') return null;

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

  const getSelectedNienHanType = () => {
    if (proposalType !== 'NIEN_HAN') return null;

    const selectedDanhHieus = titleData.map(item => item.danh_hieu).filter(Boolean);

    if (selectedDanhHieus.length === 0) return null;

    // Kiểm tra xem có các hạng HCCSVV không
    const hasHCCSVV = selectedDanhHieus.some(
      dh => dh === 'HCCSVV_HANG_BA' || dh === 'HCCSVV_HANG_NHI' || dh === 'HCCSVV_HANG_NHAT'
    );

    // Kiểm tra xem có HC_QKQT không
    const hasHC_QKQT = selectedDanhHieus.some(dh => dh === 'HC_QKQT');

    // Kiểm tra xem có KNC_VSNXD_QDNDVN không
    const hasKNC = selectedDanhHieus.some(dh => dh === 'KNC_VSNXD_QDNDVN');

    if (hasHCCSVV) {
      return 'hcsvv'; // Các hạng HCCSVV đi với nhau
    } else if (hasHC_QKQT) {
      return 'hc_qkqt'; // HC_QKQT riêng
    } else if (hasKNC) {
      return 'knc'; // KNC_VSNXD_QDNDVN riêng
    }
    return null;
  };

  const getDanhHieuOptions = () => {
    switch (proposalType) {
      case 'CA_NHAN_HANG_NAM':
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
      case 'DON_VI_HANG_NAM':
        return [
          { label: 'Đơn vị Quyết thắng (ĐVQT)', value: 'ĐVQT' },
          { label: 'Đơn vị Tiên tiến (ĐVTT)', value: 'ĐVTT' },
          { label: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)', value: 'BKBQP' },
          { label: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)', value: 'BKTTCP' },
        ];
      case 'NIEN_HAN':
        // Chỉ hiển thị các hạng HCCSVV, không hiển thị HC_QKQT và KNC_VSNXD_QDNDVN
        // vì đã có loại đề xuất riêng cho chúng
        return [
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba', value: 'HCCSVV_HANG_BA' },
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì', value: 'HCCSVV_HANG_NHI' },
          { label: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất', value: 'HCCSVV_HANG_NHAT' },
        ];
      case 'HC_QKQT':
        return [{ label: 'Huy chương Quân kỳ quyết thắng', value: 'HC_QKQT' }];
      case 'KNC_VSNXD_QDNDVN':
        return [
          { label: 'Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN', value: 'KNC_VSNXD_QDNDVN' },
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
  const updateTitle = async (id: string, field: string, value: any) => {
    // Validation cho CONG_HIEN: Kiểm tra điều kiện thời gian khi chọn danh hiệu
    if (field === 'danh_hieu' && proposalType === 'CONG_HIEN' && value) {
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

    // Validation: Kiểm tra nếu đang chọn danh hiệu và đã có danh hiệu khác loại
    if (field === 'danh_hieu' && proposalType === 'CA_NHAN_HANG_NAM' && value) {
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

    // Validation cho NIEN_HAN: Kiểm tra điều kiện thời gian cho HCCSVV
    if (field === 'danh_hieu' && proposalType === 'NIEN_HAN' && value) {
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

      const selectedType = getSelectedNienHanType();
      const isHCCSVV =
        value === 'HCCSVV_HANG_BA' || value === 'HCCSVV_HANG_NHI' || value === 'HCCSVV_HANG_NHAT';
      const isHC_QKQT = value === 'HC_QKQT';
      const isKNC = value === 'KNC_VSNXD_QDNDVN';

      // Kiểm tra xem có mix các nhóm không
      if (selectedType === 'hcsvv' && (isHC_QKQT || isKNC)) {
        // Đã có các hạng HCCSVV, không cho phép thêm HC_QKQT hoặc KNC_VSNXD_QDNDVN
        const currentData = titleData.find(d => d.personnel_id === id);
        if (!currentData || !currentData.danh_hieu) {
          message.warning(
            'Không thể đề xuất các hạng HCCSVV cùng với các loại khác trong một đề xuất. ' +
              'Vui lòng tạo đề xuất riêng cho loại danh hiệu này.'
          );
          return;
        }
      } else if (selectedType === 'hc_qkqt' && (isHCCSVV || isKNC)) {
        // Đã có HC_QKQT, không cho phép thêm các hạng HCCSVV hoặc KNC_VSNXD_QDNDVN
        const currentData = titleData.find(d => d.personnel_id === id);
        if (!currentData || !currentData.danh_hieu) {
          message.warning(
            'Không thể đề xuất HC_QKQT cùng với các loại khác trong một đề xuất. ' +
              'Vui lòng tạo đề xuất riêng cho loại danh hiệu này.'
          );
          return;
        }
      } else if (selectedType === 'knc' && (isHCCSVV || isHC_QKQT)) {
        // Đã có KNC_VSNXD_QDNDVN, không cho phép thêm các hạng HCCSVV hoặc HC_QKQT
        const currentData = titleData.find(d => d.personnel_id === id);
        if (!currentData || !currentData.danh_hieu) {
          message.warning(
            'Không thể đề xuất KNC_VSNXD_QDNDVN cùng với các loại khác trong một đề xuất. ' +
              'Vui lòng tạo đề xuất riêng cho loại danh hiệu này.'
          );
          return;
        }
      }
    }

    // Validation cho HC_QKQT và KNC_VSNXD_QDNDVN: Chỉ cho phép 1 danh hiệu tương ứng
    if (field === 'danh_hieu' && proposalType === 'HC_QKQT' && value !== 'HC_QKQT') {
      message.warning(
        'Loại đề xuất "Huy chương Quân kỳ quyết thắng" chỉ cho phép danh hiệu HC_QKQT.'
      );
      return;
    }
    if (
      field === 'danh_hieu' &&
      proposalType === 'KNC_VSNXD_QDNDVN' &&
      value !== 'KNC_VSNXD_QDNDVN'
    ) {
      message.warning(
        'Loại đề xuất "Kỷ niệm chương VSNXD QĐNDVN" chỉ cho phép danh hiệu KNC_VSNXD_QDNDVN.'
      );
      return;
    }

    // Validation cho HC_QKQT: Kiểm tra điều kiện thời gian >= 25 năm (không phân biệt nam nữ)
    if (field === 'danh_hieu' && proposalType === 'HC_QKQT' && value === 'HC_QKQT') {
      const personnelDetail = personnel.find(p => p.id === id);
      if (personnelDetail) {
        // Kiểm tra ngày nhập ngũ
        if (!personnelDetail.ngay_nhap_ngu) {
          message.error(
            `Quân nhân ${personnelDetail.ho_ten} chưa có thông tin ngày nhập ngũ. Vui lòng cập nhật thông tin ngày nhập ngũ trước khi đề xuất.`
          );
          return;
        }

        // Tính số năm từ ngày nhập ngũ
        const ngayNhapNgu = new Date(personnelDetail.ngay_nhap_ngu);
        const ngayKetThuc = personnelDetail.ngay_xuat_ngu
          ? new Date(personnelDetail.ngay_xuat_ngu)
          : new Date();

        let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
        months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
        if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
          months--;
        }
        months = Math.max(0, months);

        const years = Math.floor(months / 12);

        // Yêu cầu: >= 25 năm (không phân biệt nam nữ)
        const requiredYears = 25;

        if (years < requiredYears) {
          message.error(
            `Quân nhân ${personnelDetail.ho_ten} chưa đủ điều kiện đề xuất Huy chương Quân kỳ quyết thắng. ` +
              `Yêu cầu: >= ${requiredYears} năm phục vụ. Hiện tại: ${years} năm. ` +
              `Vui lòng kiểm tra lại thông tin ngày nhập ngũ của quân nhân này.`
          );
          return;
        }
      }
    }

    // Validation cho KNC_VSNXD_QDNDVN: Kiểm tra điều kiện thời gian theo giới tính
    if (
      field === 'danh_hieu' &&
      proposalType === 'KNC_VSNXD_QDNDVN' &&
      value === 'KNC_VSNXD_QDNDVN'
    ) {
      const personnelDetail = personnel.find(p => p.id === id);
      if (personnelDetail) {
        // Kiểm tra giới tính
        if (
          !personnelDetail.gioi_tinh ||
          (personnelDetail.gioi_tinh !== 'NAM' && personnelDetail.gioi_tinh !== 'NU')
        ) {
          message.error(
            `Quân nhân ${personnelDetail.ho_ten} chưa cập nhật thông tin giới tính. Vui lòng cập nhật thông tin giới tính trước khi đề xuất.`
          );
          return;
        }

        // Kiểm tra ngày nhập ngũ
        if (!personnelDetail.ngay_nhap_ngu) {
          message.error(
            `Quân nhân ${personnelDetail.ho_ten} chưa có thông tin ngày nhập ngũ. Vui lòng cập nhật thông tin ngày nhập ngũ trước khi đề xuất.`
          );
          return;
        }

        // Tính số năm từ ngày nhập ngũ
        const ngayNhapNgu = new Date(personnelDetail.ngay_nhap_ngu);
        const ngayKetThuc = personnelDetail.ngay_xuat_ngu
          ? new Date(personnelDetail.ngay_xuat_ngu)
          : new Date();

        let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
        months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
        if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
          months--;
        }
        months = Math.max(0, months);

        const years = Math.floor(months / 12);

        // Yêu cầu: nữ >=20 năm, nam >=25 năm
        const requiredYears = personnelDetail.gioi_tinh === 'NU' ? 20 : 25;

        if (years < requiredYears) {
          message.error(
            `Quân nhân ${personnelDetail.ho_ten} chưa đủ điều kiện để đề xuất Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN. ` +
              `Yêu cầu: ${
                personnelDetail.gioi_tinh === 'NU' ? 'Nữ' : 'Nam'
              } >= ${requiredYears} năm phục vụ (hiện tại: ${years} năm).`
          );
          return;
        }
      }
    }

    // Validation cho NIEN_HAN: Kiểm tra thứ tự hạng (phải nhận từ thấp lên cao)
    if (field === 'danh_hieu' && proposalType === 'NIEN_HAN' && value) {
      const personnelRecord = personnel.find(p => p.id === id);
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
              proposal_type: proposalType,
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
    let index: number;

    if (proposalType === 'DON_VI_HANG_NAM') {
      index = newData.findIndex(d => d.don_vi_id === id);
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
      index = newData.findIndex(d => d.personnel_id === id);
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
      return titleData.find(d => d.don_vi_id === id) || { don_vi_id: id };
    }
    return titleData.find(d => d.personnel_id === id) || { personnel_id: id };
  };

  // Check if all personnel/units have titles set
  const allTitlesSet =
    proposalType === 'DON_VI_HANG_NAM'
      ? units.every(u => {
          const data = getTitleData(u.id);
          return data.danh_hieu;
        })
      : personnel.every(p => {
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

        // Lọc danh hiệu dựa trên điều kiện thời gian cho CONG_HIEN
        let availableOptions = getDanhHieuOptions();
        if (proposalType === 'CONG_HIEN') {
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
            disabled={proposalType === 'CONG_HIEN' && availableOptions.length === 0}
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

  // Hàm tính tổng số tháng từ ngày nhập ngũ đến hiện tại (hoặc ngày xuất ngũ)
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
        : new Date(); // Nếu chưa xuất ngũ thì tính đến hiện tại

      // Đảm bảo startDate và endDate hợp lệ
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      // Tính số năm và tháng chính xác
      let years = endDate.getFullYear() - startDate.getFullYear();
      let months = endDate.getMonth() - startDate.getMonth();
      let days = endDate.getDate() - startDate.getDate();

      // Điều chỉnh nếu ngày cuối nhỏ hơn ngày đầu
      if (days < 0) {
        months -= 1;
        // Lấy số ngày của tháng trước đó
        const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
        days += lastDayOfPrevMonth;
      }

      // Điều chỉnh nếu tháng cuối nhỏ hơn tháng đầu
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      // Tính tổng số tháng (làm tròn xuống)
      const totalMonths = years * 12 + months;

      // Tính số năm và tháng còn lại để hiển thị
      const totalYears = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;

      // Trả về object với years và months riêng biệt
      return {
        years: totalYears,
        months: remainingMonths,
        totalMonths: totalMonths,
      };
    } catch {
      return null;
    }
  };

  // Hàm mở modal xem danh hiệu và NCKH
  const handleViewDetails = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);
    setModalVisible(true);

    try {
      // Lấy hồ sơ hằng năm (đã có tong_cstdcs và tong_nckh dạng JSON)
      // Truyền năm lên để tính toán lại gợi ý với năm được chọn
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

  // Hàm mở modal xem lịch sử khen thưởng
  const handleViewHistory = async (record: Personnel) => {
    setSelectedPersonnel(record);
    setLoadingModal(true);

    try {
      // Gọi modal và API phù hợp theo loại đề xuất
      if (proposalType === 'NIEN_HAN') {
        // Modal lịch sử niên hạn
        setServiceHistoryModalVisible(true);
        const profileRes = await apiClient.getServiceProfile(record.id);
        if (profileRes.success && profileRes.data) {
          setServiceProfile(profileRes.data);
        } else {
          setServiceProfile(null);
        }
      } else if (proposalType === 'CONG_HIEN') {
        // Modal lịch sử chức vụ (cống hiến)
        setPositionHistoryModalVisible(true);
        const historyRes = await apiClient.getPositionHistory(record.id);
        if (historyRes.success && historyRes.data) {
          setPositionHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        } else {
          setPositionHistory([]);
        }
      } else if (proposalType === 'NCKH') {
        // Modal lịch sử NCKH/SKKH
        setScientificAchievementHistoryModalVisible(true);
        const achievementsRes = await apiClient.getScientificAchievements(record.id);
        if (achievementsRes.success && achievementsRes.data) {
          setScientificAchievements(
            Array.isArray(achievementsRes.data) ? achievementsRes.data : []
          );
        } else {
          setScientificAchievements([]);
        }
      } else {
        // Modal lịch sử khen thưởng cá nhân hằng năm (CA_NHAN_HANG_NAM, HC_QKQT, KNC_VSNXD_QDNDVN)
        setHistoryModalVisible(true);
        const profileRes = await apiClient.getAnnualProfile(record.id, nam);
        if (profileRes.success && profileRes.data) {
          setAnnualProfile(profileRes.data);
        } else {
          setAnnualProfile(null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      message.error('Không thể tải lịch sử khen thưởng');
      setAnnualProfile(null);
      setServiceProfile(null);
      setPositionHistory([]);
      setScientificAchievements([]);
      setUnitAnnualAwards([]);
    } finally {
      setLoadingModal(false);
    }
  };

  // Hàm mở modal xem lịch sử khen thưởng đơn vị
  const handleViewUnitHistory = async (record: Unit) => {
    setSelectedUnit(record);
    setLoadingModal(true);
    setUnitAnnualAwardHistoryModalVisible(true);

    try {
      const awardsRes = await apiClient.getUnitAnnualAwards(record.id);
      if (awardsRes.success && awardsRes.data) {
        setUnitAnnualAwards(Array.isArray(awardsRes.data) ? awardsRes.data : []);
      } else {
        setUnitAnnualAwards([]);
      }
    } catch (error: any) {
      console.error('Error fetching unit awards:', error);
      message.error('Không thể tải lịch sử khen thưởng đơn vị');
      setUnitAnnualAwards([]);
    } finally {
      setLoadingModal(false);
    }
  };

  // Columns for CA_NHAN_HANG_NAM, NIEN_HAN, CONG_HIEN
  const standardColumns: ColumnsType<Personnel> = [
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
    // Thêm cột Giới tính cho đề xuất KNC_VSNXD_QDNDVN
    ...(proposalType === 'KNC_VSNXD_QDNDVN'
      ? [
          {
            title: 'Giới tính',
            key: 'gioi_tinh',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: Personnel) => {
              if (!record.gioi_tinh) {
                return <Text type="danger">Chưa cập nhật</Text>;
              }
              return <Text>{record.gioi_tinh === 'NAM' ? 'Nam' : 'Nữ'}</Text>;
            },
          },
        ]
      : []),
    // Thêm cột Tổng tháng cho đề xuất Niên hạn, HC_QKQT, KNC_VSNXD_QDNDVN
    ...(proposalType === 'NIEN_HAN' ||
    proposalType === 'HC_QKQT' ||
    proposalType === 'KNC_VSNXD_QDNDVN'
      ? [
          {
            title: 'Tổng tháng',
            key: 'tong_thang',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: Personnel) => {
              const result = calculateTotalMonths(record.ngay_nhap_ngu, record.ngay_xuat_ngu);
              if (!result) return <Text type="secondary">-</Text>;

              // Hiển thị năm ở trên, tháng nhỏ bên dưới
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
        ]
      : []),
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

        // Đối với KNC_VSNXD_QDNDVN và HC_QKQT, chỉ có 1 lựa chọn nên hiển thị dạng text
        if (proposalType === 'KNC_VSNXD_QDNDVN' || proposalType === 'HC_QKQT') {
          const danhHieuMap: Record<string, string> = {
            KNC_VSNXD_QDNDVN: 'Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN',
            HC_QKQT: 'Huân chương Quân kỳ quyết thắng',
          };
          const danhHieuValue =
            proposalType === 'KNC_VSNXD_QDNDVN' ? 'KNC_VSNXD_QDNDVN' : 'HC_QKQT';
          return <Text>{danhHieuMap[danhHieuValue]}</Text>;
        }

        // Lọc danh hiệu dựa trên điều kiện thời gian
        let availableOptions = getDanhHieuOptions();
        if (proposalType === 'CONG_HIEN') {
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
        } else if (proposalType === 'NIEN_HAN') {
          // Lọc danh hiệu dựa trên điều kiện thời gian và hạng đã nhận cho HCCSVV
          // Logic: Phải nhận từ thấp lên cao: Hạng Ba → Hạng Nhì → Hạng Nhất
          const eligibility = checkHCCSVVEligibilityForPersonnel(record);
          const serviceProfile = serviceProfilesMap[record.id];

          // Kiểm tra quân nhân đã nhận hạng nào
          const hasHangBa = serviceProfile?.hccsvv_hang_ba_status === 'DA_NHAN';
          const hasHangNhi = serviceProfile?.hccsvv_hang_nhi_status === 'DA_NHAN';
          const hasHangNhat = serviceProfile?.hccsvv_hang_nhat_status === 'DA_NHAN';

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
            disabled={
              (proposalType === 'CONG_HIEN' && availableOptions.length === 0) ||
              (proposalType === 'NIEN_HAN' && availableOptions.length === 0)
            }
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
    ...(proposalType === 'CONG_HIEN'
      ? [
          {
            title: 'Tổng thời gian (0.7)',
            key: 'total_time_0_7',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.7'),
          },
          {
            title: 'Tổng thời gian (0.8)',
            key: 'total_time_0_8',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.8'),
          },
          {
            title: 'Tổng thời gian (0.9-1.0)',
            key: 'total_time_0_9_1_0',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: Personnel) => calculateTotalTimeByGroup(record.id, '0.9-1.0'),
          },
        ]
      : []),
  ];

  // Columns for NCKH
  const nckhColumns: ColumnsType<Personnel> = [
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
              2. Đảm bảo tất cả {proposalType === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'quân nhân'} đều đã
              được chọn danh hiệu
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
            {
              titleData.filter(d => {
                if (proposalType === 'NCKH') {
                  return d.loai && d.mo_ta;
                }
                return d.danh_hieu;
              }).length
            }
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
          locale={{
            emptyText: 'Không có dữ liệu',
          }}
        />
      )}

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

      {/* Modal xem lịch sử khen thưởng cá nhân hằng năm */}
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

      {/* Modal xem lịch sử niên hạn */}
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

      {/* Modal xem lịch sử chức vụ (Cống hiến) */}
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

      {/* Modal xem lịch sử NCKH/SKKH */}
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

      {/* Modal xem lịch sử khen thưởng đơn vị hằng năm */}
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
