'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Upload,
  Steps,
  Space,
  Breadcrumb,
  Radio,
  Alert,
  message as antMessage,
  Divider,
  Descriptions,
  Tag,
  Table,
} from 'antd';
import {
  UploadOutlined,
  HomeOutlined,
  TrophyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api-client';
import axiosInstance from '@/utils/axiosInstance';
import Step2SelectPersonnelCaNhanHangNam from './components/Step2SelectPersonnelCaNhanHangNam';
import Step2SelectPersonnelNienHan from './components/Step2SelectPersonnelNienHan';
import Step2SelectPersonnelHCQKQT from './components/Step2SelectPersonnelHCQKQT';
import Step2SelectPersonnelKNCVSNXD from './components/Step2SelectPersonnelKNCVSNXD';
import Step2SelectPersonnelCongHien from './components/Step2SelectPersonnelCongHien';
import Step2SelectPersonnelNCKH from './components/Step2SelectPersonnelNCKH';
import Step2SelectUnits from './components/Step2SelectUnits';
import Step3SetTitles from './components/Step3SetTitles';

const { Title, Paragraph, Text } = Typography;

type ProposalType =
  | 'CA_NHAN_HANG_NAM'
  | 'DON_VI_HANG_NAM'
  | 'NIEN_HAN'
  | 'HC_QKQT'
  | 'KNC_VSNXD_QDNDVN'
  | 'CONG_HIEN'
  | 'NCKH';

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  ngay_nhap_ngu?: string | Date | null;
  ngay_xuat_ngu?: string | Date | null;
  ChucVu?: {
    id: string;
    ten_chuc_vu: string;
  };
  cap_bac?: string;
  CoQuanDonVi?: {
    ten_don_vi: string;
  };
  DonViTrucThuoc?: {
    ten_don_vi: string;
  };
}

export default function CreateProposalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Proposal Type
  const [proposalType, setProposalType] = useState<ProposalType>('CA_NHAN_HANG_NAM');

  // Step 2: Select Personnel/Units
  const [nam, setNam] = useState(new Date().getFullYear());
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Step 3: Set Titles
  const [titleData, setTitleData] = useState<any[]>([]);

  // Step 4: Upload Files
  const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]); // File đính kèm (optional)

  // Step 5: Personnel/Unit details for review
  const [personnelDetails, setPersonnelDetails] = useState<Personnel[]>([]);
  const [unitDetails, setUnitDetails] = useState<any[]>([]);

  // Proposal type config
  const proposalTypeConfig: Record<
    ProposalType,
    { icon: React.ReactNode; label: string; description: string }
  > = {
    CA_NHAN_HANG_NAM: {
      icon: <TrophyOutlined />,
      label: 'Cá nhân Hằng năm',
      description: 'Danh hiệu CSTT-CS, CSTĐ-CS, BK-BQP, CSTĐ-TQ',
    },
    DON_VI_HANG_NAM: {
      icon: <TeamOutlined />,
      label: 'Đơn vị Hằng năm',
      description: 'ĐVTT, ĐVQT, BK-BQP, BK-TTCP',
    },
    NIEN_HAN: {
      icon: <ClockCircleOutlined />,
      label: 'Niên hạn',
      description: 'HCCSVV các hạng',
    },
    HC_QKQT: {
      icon: <TrophyOutlined />,
      label: 'Huy chương Quân kỳ quyết thắng',
      description: 'HC Quân kỳ quyết thắng',
    },
    KNC_VSNXD_QDNDVN: {
      icon: <TrophyOutlined />,
      label: 'Kỷ niệm chương VSNXD QĐNDVN',
      description: 'Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN',
    },
    CONG_HIEN: {
      icon: <HeartOutlined />,
      label: 'Cống hiến',
      description: 'HC BVTQ 3 hạng',
    },
    NCKH: {
      icon: <ExperimentOutlined />,
      label: 'ĐTKH/SKKH',
      description: 'Nghiên cứu khoa học / Sáng kiến khoa học',
    },
  };

  // Steps config
  const getSteps = () => {
    const step2Title = proposalType === 'DON_VI_HANG_NAM' ? 'Chọn đơn vị' : 'Chọn quân nhân';
    return [
      { title: 'Chọn loại', icon: <TrophyOutlined /> },
      { title: step2Title, icon: <TeamOutlined /> },
      { title: 'Set danh hiệu', icon: <CheckCircleOutlined /> },
      { title: 'Upload file', icon: <UploadOutlined /> },
      { title: 'Xem lại & Gửi', icon: <CheckCircleOutlined /> },
    ];
  };
  const steps = getSteps();

  // Chỉ set năm hiện tại lần đầu khi component mount (nếu chưa có giá trị)
  useEffect(() => {
    if (!nam) {
      const currentYear = new Date().getFullYear();
      setNam(currentYear);
    }
  }, []);

  // Reset state khi quay lại bước 1 (chọn loại đề xuất)
  useEffect(() => {
    if (currentStep === 0) {
      // Reset tất cả state liên quan đến quân nhân/đơn vị đã chọn
      setSelectedPersonnelIds([]);
      setSelectedUnitIds([]);
      setTitleData([]);
      setAttachedFiles([]);
      setPersonnelDetails([]);
      setUnitDetails([]);
    }
  }, [currentStep]);

  // Reset state khi thay đổi loại đề xuất
  useEffect(() => {
    // Reset tất cả state khi thay đổi loại đề xuất
    setSelectedPersonnelIds([]);
    setSelectedUnitIds([]);
    setTitleData([]);
    setAttachedFiles([]);
    setPersonnelDetails([]);
    setUnitDetails([]);
    // Reset về năm hiện tại khi đổi loại đề xuất
    setNam(new Date().getFullYear());
  }, [proposalType]);

  // Fetch personnel/unit details when reaching Step 5 (Review)
  useEffect(() => {
    if (currentStep === 4) {
      if (proposalType === 'DON_VI_HANG_NAM' && selectedUnitIds.length > 0) {
        fetchUnitDetails();
      } else if (selectedPersonnelIds.length > 0) {
        fetchPersonnelDetails();
      }
    }
  }, [currentStep, proposalType, selectedUnitIds, selectedPersonnelIds]);

  const fetchPersonnelDetails = async () => {
    try {
      const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
      const responses = await Promise.all(promises);
      const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);
      setPersonnelDetails(personnelData);
    } catch (error) {
      console.error('Error fetching personnel details:', error);
    }
  };

  const fetchUnitDetails = async () => {
    try {
      console.log('Fetching unit details for review, selectedUnitIds:', selectedUnitIds);
      // Gọi API để lấy đơn vị của Manager
      const unitsRes = await apiClient.getMyUnits();
      console.log('Units API response:', unitsRes);

      if (unitsRes.success) {
        const unitsData = unitsRes.data || [];
        console.log('All manager units:', unitsData);

        // Lọc các đơn vị đã chọn
        const selectedUnits = unitsData.filter((unit: any) => selectedUnitIds.includes(unit.id));
        console.log('Selected units for review:', selectedUnits);
        setUnitDetails(selectedUnits);
      } else {
        console.error('Failed to fetch units:', unitsRes.message);
      }
    } catch (error) {
      console.error('Error fetching unit details:', error);
    }
  };

  // Validate current step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Step 1: Type selected (always true)
        return true;
      case 1: // Step 2: Must select at least 1 personnel/unit
        if (proposalType === 'DON_VI_HANG_NAM') {
          return selectedUnitIds.length > 0;
        }
        return selectedPersonnelIds.length > 0;
      case 2: // Step 3: All personnel/units must have titles set
        const expectedLength =
          proposalType === 'DON_VI_HANG_NAM' ? selectedUnitIds.length : selectedPersonnelIds.length;
        return (
          titleData.length === expectedLength &&
          titleData.every(d => {
            if (proposalType === 'NCKH') {
              return d.loai && d.mo_ta;
            } else {
              return d.danh_hieu;
            }
          })
        );
      case 3: // Step 4: Always allow to continue (attachedFiles is optional)
        return true;
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    // Validation đặc biệt cho KNC_VSNXD_QDNDVN: Kiểm tra giới tính và ngày nhập ngũ khi chuyển từ Step 2 sang Step 3
    if (
      currentStep === 1 &&
      proposalType === 'KNC_VSNXD_QDNDVN' &&
      selectedPersonnelIds.length > 0
    ) {
      try {
        const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
        const responses = await Promise.all(promises);
        const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

        const missingGender = personnelData.filter(
          p => !p.gioi_tinh || (p.gioi_tinh !== 'NAM' && p.gioi_tinh !== 'NU')
        );
        const missingNgayNhapNgu = personnelData.filter(p => !p.ngay_nhap_ngu);

        if (missingGender.length > 0 || missingNgayNhapNgu.length > 0) {
          const errors = [];
          if (missingGender.length > 0) {
            const names = missingGender.map(p => p.ho_ten).join(', ');
            errors.push(`chưa cập nhật giới tính: ${names}`);
          }
          if (missingNgayNhapNgu.length > 0) {
            const names = missingNgayNhapNgu.map(p => p.ho_ten).join(', ');
            errors.push(`chưa cập nhật ngày nhập ngũ: ${names}`);
          }
          antMessage.error(
            `Một số quân nhân ${errors.join(' và ')}. Vui lòng cập nhật trước khi tiếp tục.`
          );
          return;
        }
      } catch (error: any) {
        console.error('Error validating gender:', error);
        antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
        return;
      }
    }

    // Validation cho NIEN_HAN: Kiểm tra ngày nhập ngũ khi chuyển từ Step 2 sang Step 3
    if (currentStep === 1 && proposalType === 'NIEN_HAN' && selectedPersonnelIds.length > 0) {
      try {
        const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
        const responses = await Promise.all(promises);
        const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

        const missingNgayNhapNgu = personnelData.filter(p => !p.ngay_nhap_ngu);

        if (missingNgayNhapNgu.length > 0) {
          const names = missingNgayNhapNgu.map(p => p.ho_ten).join(', ');
          antMessage.error(
            `Một số quân nhân chưa cập nhật ngày nhập ngũ: ${names}. Vui lòng cập nhật trước khi tiếp tục.`
          );
          return;
        }
      } catch (error: any) {
        console.error('Error validating ngay_nhap_ngu:', error);
        antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
        return;
      }
    }

    // Validation cho HC_QKQT: Kiểm tra >= 25 năm phục vụ khi chuyển từ Step 2 sang Step 3
    if (currentStep === 1 && proposalType === 'HC_QKQT' && selectedPersonnelIds.length > 0) {
      try {
        const promises = selectedPersonnelIds.map(id => axiosInstance.get(`/api/personnel/${id}`));
        const responses = await Promise.all(promises);
        const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

        const ineligiblePersonnel: Array<{ ho_ten: string; reason: string }> = [];

        for (const p of personnelData) {
          if (!p.ngay_nhap_ngu) {
            ineligiblePersonnel.push({
              ho_ten: p.ho_ten,
              reason: 'Chưa cập nhật ngày nhập ngũ',
            });
            continue;
          }

          // Tính số năm phục vụ
          const ngayNhapNgu = new Date(p.ngay_nhap_ngu);
          const ngayKetThuc = p.ngay_xuat_ngu ? new Date(p.ngay_xuat_ngu) : new Date();

          let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
          months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
          if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
            months--;
          }
          months = Math.max(0, months);

          const years = Math.floor(months / 12);

          // Yêu cầu: >= 25 năm (không phân biệt nam nữ)
          if (years < 25) {
            ineligiblePersonnel.push({
              ho_ten: p.ho_ten,
              reason: `Chưa đủ 25 năm phục vụ (hiện tại: ${years} năm)`,
            });
          }
        }

        if (ineligiblePersonnel.length > 0) {
          const names = ineligiblePersonnel.map(p => `${p.ho_ten} (${p.reason})`).join(', ');
          antMessage.error(
            `Một số quân nhân chưa đủ điều kiện đề xuất Huy chương Quân kỳ quyết thắng (yêu cầu >= 25 năm): ${names}. Vui lòng cập nhật trước khi tiếp tục.`
          );
          return;
        }
      } catch (error: any) {
        console.error('Error validating HC_QKQT:', error);
        antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
        return;
      }
    }

    // Gọi API recalculate khi chuyển từ bước 2 sang bước 3 cho đề xuất CA_NHAN_HANG_NAM
    if (
      currentStep === 1 &&
      proposalType === 'CA_NHAN_HANG_NAM' &&
      selectedPersonnelIds.length > 0 &&
      canProceedToNextStep()
    ) {
      try {
        setLoading(true);
        antMessage.loading('Đang tính toán gợi ý...', 0);

        // Gọi API recalculate cho từng quân nhân đã chọn, truyền năm được chọn
        const recalculatePromises = selectedPersonnelIds.map(personnelId =>
          apiClient.recalculateProfile(personnelId, nam)
        );

        const results = await Promise.all(recalculatePromises);
        const failed = results.filter(r => !r.success);

        antMessage.destroy();

        if (failed.length > 0) {
          console.warn('Một số quân nhân không thể tính toán gợi ý:', failed);
          antMessage.warning(
            `Đã tính toán gợi ý cho ${results.length - failed.length}/${
              results.length
            } quân nhân. Một số quân nhân có thể chưa có đủ dữ liệu.`
          );
        } else {
          antMessage.success(`Đã tính toán gợi ý cho ${results.length} quân nhân`);
        }

        // Sau khi tính toán xong, mới chuyển sang bước 3
        setCurrentStep(currentStep + 1);
        return; // Return để không chạy logic chuyển step ở dưới
      } catch (error: any) {
        console.error('Error recalculating profiles:', error);
        antMessage.destroy();
        antMessage.error('Lỗi khi tính toán gợi ý. Vui lòng thử lại.');
        // Nếu lỗi, vẫn cho phép chuyển step nhưng có cảnh báo
        if (canProceedToNextStep()) {
          setCurrentStep(currentStep + 1);
        }
        return;
      } finally {
        setLoading(false);
      }
    }

    if (canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
    } else {
      switch (currentStep) {
        case 1:
          if (proposalType === 'DON_VI_HANG_NAM') {
            antMessage.warning('Vui lòng chọn ít nhất một đơn vị!');
          } else {
            antMessage.warning('Vui lòng chọn ít nhất một quân nhân!');
          }
          break;
        case 2:
          antMessage.warning('Vui lòng chọn danh hiệu cho tất cả quân nhân!');
          break;
        case 3:
          antMessage.warning('Vui lòng upload file đính kèm!');
          break;
      }
    }
  };

  // Handle previous step
  const handlePrev = () => {
    if (currentStep == 2) {
      setTitleData([]);
    }
    setCurrentStep(currentStep - 1);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation cho KNC_VSNXD_QDNDVN: Kiểm tra giới tính và ngày nhập ngũ
      if (proposalType === 'KNC_VSNXD_QDNDVN' && selectedPersonnelIds.length > 0) {
        try {
          const promises = selectedPersonnelIds.map(id =>
            axiosInstance.get(`/api/personnel/${id}`)
          );
          const responses = await Promise.all(promises);
          const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

          const missingGender = personnelData.filter(
            p => !p.gioi_tinh || (p.gioi_tinh !== 'NAM' && p.gioi_tinh !== 'NU')
          );
          const missingNgayNhapNgu = personnelData.filter(p => !p.ngay_nhap_ngu);

          if (missingGender.length > 0 || missingNgayNhapNgu.length > 0) {
            const errors = [];
            if (missingGender.length > 0) {
              const names = missingGender.map(p => p.ho_ten).join(', ');
              errors.push(`chưa cập nhật giới tính: ${names}`);
            }
            if (missingNgayNhapNgu.length > 0) {
              const names = missingNgayNhapNgu.map(p => p.ho_ten).join(', ');
              errors.push(`chưa cập nhật ngày nhập ngũ: ${names}`);
            }
            antMessage.error(
              `Một số quân nhân ${errors.join(' và ')}. Vui lòng cập nhật trước khi đề xuất.`
            );
            setLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('Error validating gender:', error);
          antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
          setLoading(false);
          return;
        }
      }

      // Validation cho NIEN_HAN: Kiểm tra ngày nhập ngũ
      if (proposalType === 'NIEN_HAN' && selectedPersonnelIds.length > 0) {
        try {
          const promises = selectedPersonnelIds.map(id =>
            axiosInstance.get(`/api/personnel/${id}`)
          );
          const responses = await Promise.all(promises);
          const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

          const missingNgayNhapNgu = personnelData.filter(p => !p.ngay_nhap_ngu);

          if (missingNgayNhapNgu.length > 0) {
            const names = missingNgayNhapNgu.map(p => p.ho_ten).join(', ');
            antMessage.error(
              `Một số quân nhân chưa cập nhật ngày nhập ngũ: ${names}. Vui lòng cập nhật trước khi đề xuất.`
            );
            setLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('Error validating ngay_nhap_ngu:', error);
          antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
          setLoading(false);
          return;
        }
      }

      // Validation cho HC_QKQT: Kiểm tra >= 25 năm phục vụ
      if (proposalType === 'HC_QKQT' && selectedPersonnelIds.length > 0) {
        try {
          const promises = selectedPersonnelIds.map(id =>
            axiosInstance.get(`/api/personnel/${id}`)
          );
          const responses = await Promise.all(promises);
          const personnelData = responses.filter(r => r.data.success).map(r => r.data.data);

          const ineligiblePersonnel: Array<{ ho_ten: string; reason: string }> = [];

          for (const p of personnelData) {
            if (!p.ngay_nhap_ngu) {
              ineligiblePersonnel.push({
                ho_ten: p.ho_ten,
                reason: 'Chưa cập nhật ngày nhập ngũ',
              });
              continue;
            }

            // Tính số năm phục vụ
            const ngayNhapNgu = new Date(p.ngay_nhap_ngu);
            const ngayKetThuc = p.ngay_xuat_ngu ? new Date(p.ngay_xuat_ngu) : new Date();

            let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
            months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
            if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
              months--;
            }
            months = Math.max(0, months);

            const years = Math.floor(months / 12);

            // Yêu cầu: >= 25 năm (không phân biệt nam nữ)
            if (years < 25) {
              ineligiblePersonnel.push({
                ho_ten: p.ho_ten,
                reason: `Chưa đủ 25 năm phục vụ (hiện tại: ${years} năm)`,
              });
            }
          }

          if (ineligiblePersonnel.length > 0) {
            const names = ineligiblePersonnel.map(p => `${p.ho_ten} (${p.reason})`).join(', ');
            antMessage.error(
              `Một số quân nhân chưa đủ điều kiện đề xuất Huy chương Quân kỳ quyết thắng (yêu cầu >= 25 năm): ${names}. Vui lòng cập nhật trước khi đề xuất.`
            );
            setLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('Error validating HC_QKQT:', error);
          antMessage.error('Lỗi khi kiểm tra thông tin quân nhân');
          setLoading(false);
          return;
        }
      }

      // Tạo FormData
      const formData = new FormData();
      formData.append('type', proposalType);
      formData.append('nam', String(nam));

      if (proposalType === 'DON_VI_HANG_NAM') {
        formData.append('selected_units', JSON.stringify(selectedUnitIds));
      } else {
        formData.append('selected_personnel', JSON.stringify(selectedPersonnelIds));
      }

      formData.append('title_data', JSON.stringify(titleData));

      // Upload các file đính kèm (optional, multiple)
      if (attachedFiles.length > 0) {
        attachedFiles.forEach(file => {
          if (file.originFileObj) {
            formData.append('attached_files', file.originFileObj as File);
          }
        });
      }

      const result = await apiClient.submitProposal(formData);

      if (!result.success) {
        throw new Error(result.message || 'Gửi đề xuất thất bại');
      }

      antMessage.success('Gửi đề xuất thành công! Chờ Admin phê duyệt.');

      // Reset form
      setCurrentStep(0);
      setProposalType('CA_NHAN_HANG_NAM');
      setNam(new Date().getFullYear()); // Reset về năm hiện tại
      setSelectedPersonnelIds([]);
      setSelectedUnitIds([]);
      setTitleData([]);
      setAttachedFiles([]);
      setPersonnelDetails([]);
      setUnitDetails([]);

      // Chuyển về trang danh sách đề xuất sau 1 giây
      setTimeout(() => {
        router.push('/manager/proposals');
      }, 1000);
    } catch (error: any) {
      antMessage.error(error.message || 'Lỗi khi gửi đề xuất');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Step 1: Choose Type
        return (
          <div>
            <Alert
              message="Bước 1: Chọn loại khen thưởng"
              description="Vui lòng chọn loại khen thưởng bạn muốn đề xuất"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Radio.Group
              value={proposalType}
              onChange={e => setProposalType(e.target.value)}
              size="large"
              style={{ width: '100%' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {Object.entries(proposalTypeConfig).map(([key, config]) => (
                  <Radio.Button
                    key={key}
                    value={key}
                    style={{ width: '100%', height: 'auto', padding: '16px' }}
                  >
                    <Space direction="vertical" size="small">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 20,
                            color: proposalType === key ? '#1890ff' : '#8c8c8c',
                          }}
                        >
                          {config.icon}
                        </span>
                        <Text strong style={{ fontSize: 16 }}>
                          {config.label}
                        </Text>
                      </div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', marginLeft: 28 }}
                      >
                        {config.description}
                      </Text>
                    </Space>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </div>
        );

      case 1: // Step 2: Select Personnel/Units
        if (proposalType === 'DON_VI_HANG_NAM') {
          return (
            <Step2SelectUnits
              selectedUnitIds={selectedUnitIds}
              onUnitChange={setSelectedUnitIds}
              nam={nam}
              onNamChange={setNam}
            />
          );
        }
        // Render component riêng cho từng loại đề xuất
        switch (proposalType) {
          case 'CA_NHAN_HANG_NAM':
            return (
              <Step2SelectPersonnelCaNhanHangNam
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          case 'NIEN_HAN':
            return (
              <Step2SelectPersonnelNienHan
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          case 'HC_QKQT':
            return (
              <Step2SelectPersonnelHCQKQT
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          case 'KNC_VSNXD_QDNDVN':
            return (
              <Step2SelectPersonnelKNCVSNXD
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          case 'CONG_HIEN':
            return (
              <Step2SelectPersonnelCongHien
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          case 'NCKH':
            return (
              <Step2SelectPersonnelNCKH
                selectedPersonnelIds={selectedPersonnelIds}
                onPersonnelChange={setSelectedPersonnelIds}
                nam={nam}
                onNamChange={setNam}
              />
            );
          default:
            return null;
        }

      case 2: // Step 3: Set Titles
        return (
          <Step3SetTitles
            selectedPersonnelIds={selectedPersonnelIds}
            selectedUnitIds={selectedUnitIds}
            proposalType={proposalType}
            titleData={titleData}
            onTitleDataChange={setTitleData}
            nam={nam}
          />
        );

      case 3: // Step 4: Upload Files
        return (
          <div>
            <Alert
              message="Bước 4: Upload file đính kèm"
              description="Upload các file đính kèm liên quan (tùy chọn, không giới hạn số lượng)"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {/* Upload file đính kèm */}
            <Upload.Dragger
              fileList={attachedFiles}
              onChange={({ fileList }) => setAttachedFiles(fileList)}
              beforeUpload={() => false}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">Click hoặc kéo file vào đây để upload</p>
              <p className="ant-upload-hint">
                Hỗ trợ: PDF, Word (.doc, .docx), Excel (.xls, .xlsx). Có thể chọn nhiều file cùng
                lúc, không giới hạn số lượng.
              </p>
            </Upload.Dragger>
          </div>
        );

      case 4: // Step 5: Review & Submit
        // Merge personnel/unit details with title data
        let reviewTableData: any[] = [];

        if (proposalType === 'DON_VI_HANG_NAM') {
          reviewTableData = unitDetails.map(unit => {
            const titleInfo = titleData.find(t => t.don_vi_id === unit.id);
            return {
              ...unit,
              ...titleInfo,
            };
          });
        } else {
          reviewTableData = personnelDetails.map(p => {
            const titleInfo = titleData.find(t => t.personnel_id === p.id);
            return {
              ...p,
              ...titleInfo,
            };
          });
        }

        // Build table columns based on proposal type
        const reviewColumns: ColumnsType<any> = [];

        if (proposalType === 'DON_VI_HANG_NAM') {
          reviewColumns.push(
            {
              title: 'STT',
              key: 'index',
              width: 60,
              align: 'center',
              render: (_, __, index) => index + 1,
            },
            {
              title: 'Loại đơn vị',
              key: 'type',
              width: 150,
              align: 'center',
              render: (_, record) => {
                const type =
                  record.co_quan_don_vi_id || record.CoQuanDonVi
                    ? 'DON_VI_TRUC_THUOC'
                    : 'CO_QUAN_DON_VI';
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
              align: 'center',
              render: (text: string) => <Text code>{text}</Text>,
            },
            {
              title: 'Tên đơn vị',
              dataIndex: 'ten_don_vi',
              key: 'ten_don_vi',
              width: 250,
              align: 'center',
              render: (text: string) => <Text strong>{text}</Text>,
            }
          );
        } else {
          reviewColumns.push(
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
              width: 250,
              align: 'center',
              render: (text: string, record: any) => {
                // Kiểm tra cả hai cấu trúc: từ API (CoQuanDonVi) và từ JSON (co_quan_don_vi)
                const coQuanDonVi =
                  record.co_quan_don_vi?.ten_co_quan_don_vi ||
                  record.CoQuanDonVi?.ten_don_vi ||
                  record.don_vi_truc_thuoc?.co_quan_don_vi?.ten_don_vi ||
                  record.DonViTrucThuoc?.CoQuanDonVi?.ten_don_vi;
                const donViTrucThuoc =
                  record.don_vi_truc_thuoc?.ten_don_vi || record.DonViTrucThuoc?.ten_don_vi;
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
              render: (_, record: any) => {
                // Lấy thông tin từ personnel details nếu có
                const personnelDetail = personnelDetails.find(
                  (p: any) => p.id === record.personnel_id || p.id === record.id
                );
                const capBac = personnelDetail?.cap_bac || record.cap_bac;
                const chucVu = personnelDetail?.ChucVu?.ten_chuc_vu || record.ChucVu?.ten_chuc_vu;
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
            }
          );

          // Thêm cột Tổng tháng cho đề xuất Niên hạn
          if (
            proposalType === 'NIEN_HAN' ||
            proposalType === 'HC_QKQT' ||
            proposalType === 'KNC_VSNXD_QDNDVN'
          ) {
            // Hàm tính tổng số tháng
            const calculateTotalMonths = (
              ngayNhapNgu: string | Date | null | undefined,
              ngayXuatNgu: string | Date | null | undefined
            ) => {
              if (!ngayNhapNgu) return null;

              try {
                const startDate =
                  typeof ngayNhapNgu === 'string' ? new Date(ngayNhapNgu) : ngayNhapNgu;
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
                  const lastDayOfPrevMonth = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    0
                  ).getDate();
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

            reviewColumns.push({
              title: 'Tổng tháng',
              key: 'tong_thang',
              width: 150,
              align: 'center' as const,
              render: (_: any, record: any) => {
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
            });
          }
        }

        // Add title/achievement columns based on type
        if (proposalType === 'NCKH') {
          reviewColumns.push(
            {
              title: 'Loại',
              dataIndex: 'loai',
              key: 'loai',
              width: 160,
              align: 'center',
              render: (loai: string) => (
                <Tag color={loai === 'NCKH' ? 'blue' : 'green'}>
                  {loai === 'NCKH' ? 'Đề tài khoa học' : 'Sáng kiến khoa học'}
                </Tag>
              ),
            },
            {
              title: 'Mô tả',
              dataIndex: 'mo_ta',
              key: 'mo_ta',
              align: 'center',
              ellipsis: true,
            }
          );
        } else {
          reviewColumns.push({
            title: 'Danh hiệu đề xuất',
            dataIndex: 'danh_hieu',
            key: 'danh_hieu',
            width: 250,
            align: 'center',
            render: (danh_hieu: string) => {
              // Map mã danh hiệu sang tên đầy đủ
              const danhHieuMap: Record<string, string> = {
                // Cá nhân Hằng năm
                CSTDCS: 'Chiến sĩ thi đua cơ sở (CSTDCS)',
                CSTT: 'Chiến sĩ tiên tiến (CSTT)',
                BKBQP: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)',
                CSTDTQ: 'Chiến sĩ thi đua toàn quân (CSTDTQ)',
                // Đơn vị Hằng năm - BKBQP cũng dùng chung tên này
                // Đơn vị Hằng năm
                ĐVQT: 'Đơn vị Quyết thắng (ĐVQT)',
                ĐVTT: 'Đơn vị Tiên tiến (ĐVTT)',
                BKTTCP: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)',
                // Niên hạn
                HCCSVV_HANG_BA: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba',
                HCCSVV_HANG_NHI: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì',
                HCCSVV_HANG_NHAT: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất',
                // HC_QKQT
                HC_QKQT: 'Huy chương Quân kỳ quyết thắng',
                // KNC_VSNXD_QDNDVN
                KNC_VSNXD_QDNDVN: 'Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN',
                // Cống hiến
                HCBVTQ_HANG_BA: 'Huân chương Bảo vệ Tổ quốc Hạng Ba',
                HCBVTQ_HANG_NHI: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì',
                HCBVTQ_HANG_NHAT: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất',
              };

              const fullName = danhHieuMap[danh_hieu] || danh_hieu;
              return <Text>{fullName}</Text>;
            },
          });
        }

        return (
          <div>
            <Alert
              message="Bước 5: Xem lại thông tin và gửi đề xuất"
              description="Kiểm tra kỹ thông tin trước khi gửi"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Card title="Tóm tắt đề xuất" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Loại khen thưởng" span={2}>
                  <Tag icon={proposalTypeConfig[proposalType].icon}>
                    {proposalTypeConfig[proposalType].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Năm đề xuất">
                  <Text strong>{nam}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={proposalType === 'DON_VI_HANG_NAM' ? 'Số đơn vị' : 'Số quân nhân'}
                >
                  <Text strong>
                    {proposalType === 'DON_VI_HANG_NAM'
                      ? selectedUnitIds.length
                      : selectedPersonnelIds.length}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="File đính kèm" span={2}>
                  {attachedFiles.length > 0 ? (
                    <Text strong>{attachedFiles.length} file</Text>
                  ) : (
                    <Text type="secondary">Không có file</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                proposalType === 'DON_VI_HANG_NAM'
                  ? 'Danh sách đơn vị và danh hiệu'
                  : 'Danh sách quân nhân và danh hiệu'
              }
            >
              <Table
                columns={reviewColumns}
                dataSource={reviewTableData}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                scroll={{
                  x:
                    proposalType === 'NCKH'
                      ? 1100
                      : proposalType === 'NIEN_HAN' ||
                        proposalType === 'HC_QKQT' ||
                        proposalType === 'KNC_VSNXD_QDNDVN'
                      ? 1150
                      : 1000,
                }}
                locale={{
                  emptyText: 'Không có dữ liệu',
                }}
              />
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <Link href="/manager/dashboard">
                <HomeOutlined />
              </Link>
            ),
          },
          {
            title: 'Tạo Danh Sách Đề Xuất Khen Thưởng',
          },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (currentStep === 0) {
                // Nếu đang ở bước chọn loại đề xuất, quay về trang danh sách
                router.push('/manager/proposals');
              } else {
                // Nếu đang ở bước khác, quay lại bước chọn loại đề xuất
                setCurrentStep(0);
              }
            }}
            style={{ marginBottom: 0 }}
          >
            {currentStep === 0 ? 'Quay lại danh sách' : 'Quay lại chọn loại đề xuất'}
          </Button>
        </div>
        <Title level={2} style={{ marginBottom: 8 }}>
          Tạo Danh Sách Đề Xuất Khen Thưởng
        </Title>
        <Paragraph type="secondary">
          Theo dõi các bước bên dưới để hoàn thành đề xuất khen thưởng
        </Paragraph>
      </div>

      {/* Steps Progress */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      {/* Step Content */}
      <Card style={{ marginBottom: 24, minHeight: 400 }}>{renderStepContent()}</Card>

      {/* Navigation */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button size="large" onClick={handlePrev} disabled={currentStep === 0}>
            Quay lại
          </Button>
          <div>
            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Gửi đề xuất
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
