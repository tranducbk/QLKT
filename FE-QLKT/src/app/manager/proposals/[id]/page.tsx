'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Descriptions,
  Button,
  Typography,
  Breadcrumb,
  Tag,
  Alert,
  Space,
  message,
  Divider,
  Table,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  TrophyOutlined,
  BookOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import axiosInstance from '@/utils/axiosInstance';
import { useTheme } from '@/components/theme-provider';
import styles from './proposal-detail.module.css';

const { Title, Text } = Typography;

interface DanhHieuItem {
  personnel_id: string;
  ho_ten: string;
  nam: number;
  danh_hieu: string | null;
  so_quyet_dinh?: string | null;
  file_quyet_dinh?: string | null;
  // Các trường cũ (tương thích với dữ liệu cũ, không dùng nữa)
  nhan_bkbqp?: boolean;
  so_quyet_dinh_bkbqp?: string | null;
  file_quyet_dinh_bkbqp?: string | null;
  nhan_cstdtq?: boolean;
  so_quyet_dinh_cstdtq?: string | null;
  file_quyet_dinh_cstdtq?: string | null;
  co_quan_don_vi?: {
    id: string;
    ten_co_quan_don_vi: string;
    ma_co_quan_don_vi: string;
  } | null;
  don_vi_truc_thuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    co_quan_don_vi?: {
      id: string;
      ten_don_vi_truc: string;
      ma_don_vi: string;
    } | null;
  } | null;
}

interface ThanhTichItem {
  personnel_id: string;
  ho_ten: string;
  nam: number;
  loai: string;
  mo_ta: string;
  status: string;
  so_quyet_dinh?: string | null;
  file_quyet_dinh?: string | null;
  co_quan_don_vi?: {
    id: string;
    ten_co_quan_don_vi: string;
    ma_co_quan_don_vi: string;
  } | null;
  don_vi_truc_thuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    co_quan_don_vi?: {
      id: string;
      ten_don_vi_truc: string;
      ma_don_vi: string;
    } | null;
  } | null;
}

interface AttachedFile {
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

interface ProposalDetail {
  id: number;
  loai_de_xuat:
    | 'CA_NHAN_HANG_NAM'
    | 'DON_VI_HANG_NAM'
    | 'NIEN_HAN'
    | 'CONG_HIEN'
    | 'DOT_XUAT'
    | 'NCKH';
  nam: number;
  don_vi: {
    id: number;
    ma_don_vi: string;
    ten_don_vi: string;
  };
  nguoi_de_xuat: {
    id: number;
    username: string;
    ho_ten: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data_danh_hieu: DanhHieuItem[];
  data_thanh_tich: ThanhTichItem[];
  data_nien_han?: DanhHieuItem[];
  files_attached: AttachedFile[];
  nguoi_duyet: any;
  ngay_duyet: string | null;
  ghi_chu: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ManagerProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { theme: currentTheme } = useTheme();
  const proposalId = params?.id as string;
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [positionHistoriesMap, setPositionHistoriesMap] = useState<Record<string, any[]>>({});
  const [personnelDetails, setPersonnelDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetail();
    }
  }, [proposalId]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProposalById(proposalId);

      if (response.success) {
        setProposal(response.data);

        // Fetch thông tin personnel để lấy chức vụ hiện tại
        if (response.data.data_danh_hieu) {
          const danhHieuData = Array.isArray(response.data.data_danh_hieu)
            ? response.data.data_danh_hieu
            : typeof response.data.data_danh_hieu === 'string'
            ? JSON.parse(response.data.data_danh_hieu)
            : [];
          await fetchPersonnelDetails(danhHieuData);

          // Fetch lịch sử chức vụ cho tất cả quân nhân để hiển thị thời gian
          await fetchPositionHistories(danhHieuData);
        }
      } else {
        message.error(response.message || 'Không thể tải chi tiết đề xuất');
      }
    } catch (error: any) {
      message.error('Lỗi khi tải chi tiết đề xuất');
      console.error('Fetch proposal detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnelDetails = async (danhHieuItems: any[]) => {
    try {
      const detailsMap: Record<string, any> = {};

      // Fetch thông tin personnel cho mỗi quân nhân
      await Promise.all(
        danhHieuItems.map(async item => {
          if (item.personnel_id) {
            try {
              const res = await apiClient.getPersonnelById(item.personnel_id);
              if (res.success && res.data) {
                detailsMap[item.personnel_id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
            }
          }
        })
      );

      setPersonnelDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching personnel details:', error);
    }
  };

  const fetchPositionHistories = async (danhHieuItems: DanhHieuItem[]) => {
    try {
      const historiesMap: Record<string, any[]> = {};

      // Fetch lịch sử chức vụ cho mỗi quân nhân
      await Promise.all(
        danhHieuItems.map(async item => {
          if (item.personnel_id) {
            try {
              const res = await apiClient.getPositionHistory(item.personnel_id);
              if (res.success && res.data) {
                historiesMap[item.personnel_id] = res.data;
              }
            } catch (error) {
              // Ignore errors for individual personnel
              historiesMap[item.personnel_id] = [];
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

  const handleOpenDecisionFile = async (soQuyetDinh: string, filePath?: string | null) => {
    try {
      let filename: string | null = null;

      // Nếu đã có file_path trong record, dùng luôn
      if (filePath) {
        filename = filePath.split('/').pop() || null;
      } else {
        // Nếu chưa có file_path, tìm từ DB dựa trên số quyết định
        const response = await apiClient.getDecisionBySoQuyetDinh(soQuyetDinh);
        if (response.success && response.data?.file_path) {
          filename = response.data.file_path.split('/').pop() || null;
        }
      }

      if (filename) {
        // Tải file về bằng axios với responseType: 'blob'
        const response = await axiosInstance.get(`/api/proposals/uploads/${filename}`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${soQuyetDinh}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('Tải file thành công');
      } else {
        message.warning('Không tìm thấy file quyết định');
      }
    } catch (error: any) {
      message.error('Lỗi khi tải file quyết định');
      console.error('Download decision file error:', error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const blob = await apiClient.downloadProposalExcel(proposalId.toString());

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `de-xuat-${proposalId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Tải file thành công');
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tải file');
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getProposalTypeLabel = (type: string) => {
    const typeConfig: Record<string, string> = {
      CA_NHAN_HANG_NAM: 'Cá nhân Hằng năm',
      DON_VI_HANG_NAM: 'Đơn vị Hằng năm',
      NIEN_HAN: 'Niên hạn',
      CONG_HIEN: 'Cống hiến',
      DOT_XUAT: 'Đột xuất',
      NCKH: 'ĐTKH/SKKH',
    };
    return typeConfig[type] || type;
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      PENDING: {
        color: 'gold',
        icon: <ClockCircleOutlined />,
        text: 'Chờ duyệt',
      },
      APPROVED: {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: 'Đã duyệt',
      },
      REJECTED: {
        color: 'red',
        icon: <CloseCircleOutlined />,
        text: 'Từ chối',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
        {config.text}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card loading={true} />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-6 p-6">
        <Alert message="Không tìm thấy đề xuất" type="error" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgContainer: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          colorText: currentTheme === 'dark' ? '#f3f4f6' : '#111827',
          colorBorder: currentTheme === 'dark' ? '#4b5563' : '#d1d5db',
        },
        components: {
          Table: {
            rowHoverBg: currentTheme === 'dark' ? '#374151' : '#f9fafb',
            colorBgContainer: currentTheme === 'dark' ? '#111827' : '#ffffff',
            colorText: currentTheme === 'dark' ? '#f3f4f6' : '#111827',
            colorTextHeading: currentTheme === 'dark' ? '#f9fafb' : '#111827',
            colorBorderSecondary: currentTheme === 'dark' ? '#374151' : '#e5e7eb',
          },
        },
      }}
    >
      <div className="space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link href="/manager/dashboard">
              <HomeOutlined />
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/manager/proposals">Đề xuất khen thưởng</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Chi tiết</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/manager/proposals">
              <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
            </Link>
            <Title level={2} className="!mb-0">
              Chi tiết đề xuất {getProposalTypeLabel(proposal.loai_de_xuat)}
            </Title>
          </div>
          {/* Tạm thời ẩn chức năng tải file Excel */}
          {/* <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadExcel}
            loading={downloading}
            size="large"
          >
            Tải file Excel
          </Button> */}
        </div>

        {/* Status Alert */}
        {proposal.status === 'REJECTED' && proposal.ghi_chu && (
          <Alert
            message="Đề xuất bị từ chối"
            description={
              <div>
                <Text strong>Lý do từ chối: </Text>
                <Text>{proposal.ghi_chu}</Text>
                <br />
                <br />
                <Text type="secondary">
                  💡 Bạn có thể tải file Excel về, chỉnh sửa theo lý do từ chối, sau đó tạo đề xuất
                  mới.
                </Text>
              </div>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        )}

        {proposal.status === 'APPROVED' && (
          <Alert
            message="Đề xuất đã được phê duyệt"
            description={
              <div>
                <Text>Dữ liệu đã được nhập vào hệ thống và cập nhật hồ sơ quân nhân.</Text>
                {proposal.ghi_chu && (
                  <>
                    <br />
                    <br />
                    <Text strong>Ghi chú từ Admin: </Text>
                    <Text>{proposal.ghi_chu}</Text>
                  </>
                )}
              </div>
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {proposal.status === 'PENDING' && (
          <Alert
            message="Đề xuất đang chờ duyệt"
            description="Đề xuất của bạn đang chờ Admin xem xét và phê duyệt."
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
          />
        )}

        {/* Proposal Info */}
        <Card title="Thông tin đề xuất" className="shadow-sm">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Loại đề xuất" span={2}>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                {getProposalTypeLabel(proposal.loai_de_xuat)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Năm đề xuất">
              <Text strong style={{ fontSize: 16 }}>
                {proposal.nam}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(proposal.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị">
              {proposal.don_vi.ten_don_vi} ({proposal.don_vi.ma_don_vi})
            </Descriptions.Item>
            <Descriptions.Item label="Người đề xuất">
              {proposal.nguoi_de_xuat.ho_ten || proposal.nguoi_de_xuat.username}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày gửi">
              {format(new Date(proposal.createdAt), 'dd/MM/yyyy HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng" span={2}>
              {proposal.loai_de_xuat === 'NCKH' ? (
                <Tag color="magenta">{proposal.data_thanh_tich?.length || 0} đề tài/sáng kiến</Tag>
              ) : (
                <Tag color="blue">{proposal.data_danh_hieu?.length || 0} quân nhân</Tag>
              )}
            </Descriptions.Item>
            {proposal.nguoi_duyet && (
              <Descriptions.Item label="Người duyệt">
                {proposal.nguoi_duyet.ho_ten || proposal.nguoi_duyet.username}
              </Descriptions.Item>
            )}
            {proposal.ngay_duyet && (
              <Descriptions.Item label="Ngày duyệt">
                {format(new Date(proposal.ngay_duyet), 'dd/MM/yyyy HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Attached Files */}
        {proposal.files_attached && proposal.files_attached.length > 0 && (
          <Card title="File đính kèm" className="shadow-sm">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {proposal.files_attached.map((file, index) => (
                <div
                  key={index}
                  className={`${styles.fileItem} ${
                    currentTheme === 'dark' ? styles.fileItemDark : styles.fileItemLight
                  }`}
                >
                  <div className={styles.fileContent}>
                    <div className={styles.fileHeader}>
                      <FilePdfOutlined
                        className={
                          currentTheme === 'dark' ? styles.fileIconDark : styles.fileIconLight
                        }
                      />
                      <Text
                        strong
                        className={`break-all ${
                          currentTheme === 'dark' ? styles.fileNameDark : styles.fileNameLight
                        }`}
                      >
                        {decodeURIComponent(escape(file.originalName))}
                      </Text>
                    </div>
                    <Text
                      type="secondary"
                      className={`text-xs ${
                        currentTheme === 'dark' ? styles.fileInfoDark : styles.fileInfoLight
                      }`}
                    >
                      Kích thước: {(file.size / 1024).toFixed(2)} KB • Ngày tải lên:{' '}
                      {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm')}
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={async () => {
                      try {
                        // Sử dụng axiosInstance để tự động gửi token authentication
                        const response = await axiosInstance.get(
                          `/api/proposals/uploads/${file.filename}`,
                          {
                            responseType: 'blob', // Nhận file dưới dạng blob
                          }
                        );

                        const blob = response.data;

                        // Create download link with original filename
                        const downloadUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = file.originalName; // Sử dụng tên file gốc
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(downloadUrl);

                        message.success('Tải file thành công');
                      } catch (error) {
                        message.error('Lỗi khi tải file');
                        console.error('Download error:', error);
                      }
                    }}
                    className={styles.downloadButton}
                  >
                    Tải xuống
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Data Tables - Hiển thị theo loại đề xuất */}
        {proposal.loai_de_xuat === 'NCKH' ? (
          // Component cho đề xuất NCKH (ĐTKH/SKKH)
          <Card
            className="shadow-sm"
            title={
              <span>
                <BookOutlined style={{ marginRight: 8 }} />
                Thành Tích Khoa Học ({proposal.data_thanh_tich?.length || 0})
              </span>
            }
          >
            <Table
              dataSource={proposal.data_thanh_tich || []}
              rowKey={(_, index) => `tt_${index}`}
              pagination={false}
              columns={[
                {
                  title: 'STT',
                  key: 'index',
                  width: 60,
                  align: 'center',
                  render: (_, __, index) => index + 1,
                },
                {
                  title: 'Họ tên',
                  dataIndex: 'ho_ten',
                  key: 'ho_ten',
                  width: 250,
                  align: 'center',
                  render: (text: string, record: any) => {
                    const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
                    const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
                    const parts = [];
                    if (donViTrucThuoc) parts.push(donViTrucThuoc);
                    if (coQuanDonVi) parts.push(coQuanDonVi);
                    const unitInfo = parts.length > 0 ? parts.join(', ') : null;

                    return (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <Text strong>{text || '-'}</Text>
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
                  render: text => (
                    <Tag color={text === 'NCKH' ? 'blue' : 'green'}>
                      {text === 'NCKH' ? 'Đề tài khoa học' : 'Sáng kiến khoa học'}
                    </Tag>
                  ),
                },
                {
                  title: 'Mô tả',
                  dataIndex: 'mo_ta',
                  key: 'mo_ta',
                  width: 300,
                  align: 'center',
                  render: text => <Text>{text || '-'}</Text>,
                },
                ...(proposal.status === 'APPROVED'
                  ? [
                      {
                        title: 'Số quyết định',
                        dataIndex: 'so_quyet_dinh',
                        key: 'so_quyet_dinh',
                        width: 180,
                        align: 'center' as const,
                        render: (text: string, record: ThanhTichItem) => {
                          if (!text || (typeof text === 'string' && text.trim() === '')) {
                            return <Text type="secondary">-</Text>;
                          }

                          return (
                            <a
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDecisionFile(text, record.file_quyet_dinh);
                              }}
                              style={{
                                color: '#1890ff',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              {text}
                            </a>
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        ) : proposal.data_danh_hieu && proposal.data_danh_hieu.length > 0 ? (
          // Component cho đề xuất có danh hiệu (CA_NHAN_HANG_NAM, DON_VI_HANG_NAM, NIEN_HAN, CONG_HIEN, DOT_XUAT)
          <Card
            className="shadow-sm"
            title={
              <span>
                <TrophyOutlined style={{ marginRight: 8 }} />
                Danh Hiệu Hằng Năm ({proposal.data_danh_hieu?.length || 0})
              </span>
            }
          >
            <Table
              dataSource={proposal.data_danh_hieu || []}
              rowKey={(_, index) => `dh_${index}`}
              pagination={false}
              columns={[
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
                    const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
                    const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
                    const parts = [];
                    if (donViTrucThuoc) parts.push(donViTrucThuoc);
                    if (coQuanDonVi) parts.push(coQuanDonVi);
                    const unitInfo = parts.length > 0 ? parts.join(', ') : null;

                    return (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <Text strong>{text || '-'}</Text>
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
                  title: 'Chức vụ hiện tại',
                  key: 'chuc_vu',
                  width: 200,
                  align: 'center',
                  render: (_: any, record: any) => {
                    const personnelDetail = personnelDetails[record.personnel_id || ''];
                    const chucVu = personnelDetail?.ChucVu?.ten_chuc_vu;
                    return <Text>{chucVu || '-'}</Text>;
                  },
                },
                {
                  title: 'Năm',
                  dataIndex: 'nam',
                  key: 'nam',
                  width: 100,
                  align: 'center',
                },
                {
                  title: 'Danh hiệu đề xuất',
                  dataIndex: 'danh_hieu',
                  key: 'danh_hieu',
                  width: 180,
                  align: 'center',
                  render: (text: string) =>
                    text ? <Text>{text}</Text> : <Text type="secondary">-</Text>,
                },
                {
                  title: 'Tổng thời gian (0.7)',
                  key: 'total_time_0_7',
                  width: 150,
                  align: 'center' as const,
                  render: (_: any, record: DanhHieuItem) =>
                    calculateTotalTimeByGroup(record.personnel_id || '', '0.7'),
                },
                {
                  title: 'Tổng thời gian (0.8)',
                  key: 'total_time_0_8',
                  width: 150,
                  align: 'center' as const,
                  render: (_: any, record: DanhHieuItem) =>
                    calculateTotalTimeByGroup(record.personnel_id || '', '0.8'),
                },
                {
                  title: 'Tổng thời gian (0.9-1.0)',
                  key: 'total_time_0_9_1_0',
                  width: 150,
                  align: 'center' as const,
                  render: (_: any, record: DanhHieuItem) =>
                    calculateTotalTimeByGroup(record.personnel_id || '', '0.9-1.0'),
                },
                ...(proposal.status === 'APPROVED'
                  ? [
                      {
                        title: 'Số quyết định',
                        dataIndex: 'so_quyet_dinh',
                        key: 'so_quyet_dinh',
                        width: 180,
                        align: 'center' as const,
                        render: (text: string, record: DanhHieuItem) => {
                          const soQuyetDinh =
                            text || record.so_quyet_dinh_bkbqp || record.so_quyet_dinh_cstdtq;
                          const fileQuyetDinh =
                            record.file_quyet_dinh ||
                            record.file_quyet_dinh_bkbqp ||
                            record.file_quyet_dinh_cstdtq;

                          if (
                            !soQuyetDinh ||
                            (typeof soQuyetDinh === 'string' && soQuyetDinh.trim() === '')
                          ) {
                            return <Text type="secondary">-</Text>;
                          }

                          return (
                            <a
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDecisionFile(soQuyetDinh, fileQuyetDinh);
                              }}
                              style={{
                                color: '#1890ff',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              {soQuyetDinh}
                            </a>
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        ) : proposal.data_nien_han && proposal.data_nien_han.length > 0 ? (
          // Component cho đề xuất niên hạn
          <Card
            className="shadow-sm"
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Niên Hạn ({proposal.data_nien_han?.length || 0})
              </span>
            }
          >
            <Table
              dataSource={proposal.data_nien_han || []}
              rowKey={(_, index) => `nh_${index}`}
              pagination={false}
              columns={[
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
                    const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
                    const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
                    const parts = [];
                    if (donViTrucThuoc) parts.push(donViTrucThuoc);
                    if (coQuanDonVi) parts.push(coQuanDonVi);
                    const unitInfo = parts.length > 0 ? parts.join(', ') : null;

                    return (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <Text strong>{text || '-'}</Text>
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
                  title: 'Năm',
                  dataIndex: 'nam',
                  key: 'nam',
                  width: 100,
                  align: 'center',
                },
                {
                  title: 'Danh hiệu đề xuất',
                  dataIndex: 'danh_hieu',
                  key: 'danh_hieu',
                  width: 180,
                  align: 'center',
                  render: (text: string) =>
                    text ? <Text>{text}</Text> : <Text type="secondary">-</Text>,
                },
                ...(proposal.status === 'APPROVED'
                  ? [
                      {
                        title: 'Số quyết định',
                        dataIndex: 'so_quyet_dinh',
                        key: 'so_quyet_dinh',
                        width: 180,
                        align: 'center' as const,
                        render: (text: string, record: DanhHieuItem) => {
                          const soQuyetDinh =
                            text || record.so_quyet_dinh_bkbqp || record.so_quyet_dinh_cstdtq;
                          const fileQuyetDinh =
                            record.file_quyet_dinh ||
                            record.file_quyet_dinh_bkbqp ||
                            record.file_quyet_dinh_cstdtq;

                          if (
                            !soQuyetDinh ||
                            (typeof soQuyetDinh === 'string' && soQuyetDinh.trim() === '')
                          ) {
                            return <Text type="secondary">-</Text>;
                          }

                          return (
                            <a
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDecisionFile(soQuyetDinh, fileQuyetDinh);
                              }}
                              style={{
                                color: '#1890ff',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              {soQuyetDinh}
                            </a>
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        ) : null}

        {/* Action Buttons */}
        {proposal.status === 'REJECTED' && (
          <Card className="shadow-sm bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={4} className="!mb-0">
                Hướng dẫn sửa đề xuất
              </Title>
              <Text>
                1. Nhấn nút "Tải file Excel" ở trên để tải file về
                <br />
                2. Mở file và chỉnh sửa theo lý do từ chối
                <br />
                3. Lưu file sau khi đã sửa
                <br />
                4. Tạo đề xuất mới với file đã chỉnh sửa
              </Text>
              <Link href="/manager/proposals/create">
                <Button type="primary" size="large">
                  Tạo đề xuất mới
                </Button>
              </Link>
            </Space>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}
