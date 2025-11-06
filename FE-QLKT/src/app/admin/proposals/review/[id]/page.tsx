'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Badge,
  Table,
  Tabs,
  Alert,
  Typography,
  Breadcrumb,
  Space,
  Spin,
  Divider,
  Empty,
  Modal,
  Form,
  Input,
  Upload,
  Tag,
  message as antdMessage,
} from 'antd';
import {
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  BookOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  ExportOutlined,
  WarningOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { EditableCell } from '@/components/EditableCell';
import { format } from 'date-fns';
import type { UploadFile } from 'antd/es/upload/interface';
import { apiClient } from '@/lib/api-client';
import { BASE_URL } from '@/configs';

const { Title, Paragraph, Text } = Typography;

interface DanhHieuItem {
  cccd: string;
  ho_ten: string;
  nam: number;
  danh_hieu: string | null;
  nhan_bkbqp: boolean;
  so_quyet_dinh_bkbqp: string | null;
  nhan_cstdtq: boolean;
  so_quyet_dinh_cstdtq: string | null;
}

interface ThanhTichItem {
  cccd: string;
  ho_ten: string;
  nam: number;
  loai: string;
  mo_ta: string;
  status: string;
}

interface ProposalDetail {
  id: number;
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
  status: string;
  data_danh_hieu: DanhHieuItem[];
  data_thanh_tich: ThanhTichItem[];
  ghi_chu: string | null;
  nguoi_duyet: any;
  ngay_duyet: string | null;
  ten_file_pdf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [editedDanhHieu, setEditedDanhHieu] = useState<DanhHieuItem[]>([]);
  const [editedThanhTich, setEditedThanhTich] = useState<ThanhTichItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Decision and PDF states
  const [form] = Form.useForm();
  const [fileListCSTT, setFileListCSTT] = useState<UploadFile[]>([]);
  const [fileListCSTDCS, setFileListCSTDCS] = useState<UploadFile[]>([]);
  const [fileListBKBQP, setFileListBKBQP] = useState<UploadFile[]>([]);
  const [fileListCSTDTQ, setFileListCSTDTQ] = useState<UploadFile[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [ghiChu, setGhiChu] = useState('');

  useEffect(() => {
    if (id) {
      fetchProposalDetail();
    }
  }, [id]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProposalById(String(id));

      if (res.success && res.data) {
        setProposal(res.data);
        // Backend đã đảm bảo trả về array, nhưng vẫn kiểm tra để an toàn
        const danhHieuData = res.data.data_danh_hieu;
        const thanhTichData = res.data.data_thanh_tich;

        // Đảm bảo luôn là array
        const parsedDanhHieu = Array.isArray(danhHieuData)
          ? danhHieuData
          : danhHieuData && typeof danhHieuData === 'string'
          ? JSON.parse(danhHieuData)
          : [];

        const parsedThanhTich = Array.isArray(thanhTichData)
          ? thanhTichData
          : thanhTichData && typeof thanhTichData === 'string'
          ? JSON.parse(thanhTichData)
          : [];

        setEditedDanhHieu(parsedDanhHieu);
        setEditedThanhTich(parsedThanhTich);
      } else {
        setMessage({ type: 'error', text: res.message || 'Không tải được đề xuất' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi tải đề xuất' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!ghiChu.trim()) {
      antdMessage.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setRejecting(true);
      setMessage(null);

      const response = await apiClient.rejectProposal(String(id), ghiChu);

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Đã từ chối đề xuất thành công' });
        setRejectModalVisible(false);
        await fetchProposalDetail();

        setTimeout(() => {
          router.push('/admin/proposals/review');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Lỗi khi từ chối đề xuất' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi từ chối đề xuất' });
    } finally {
      setRejecting(false);
    }
  };

  const handleApprove = async () => {
    // Validate form first
    try {
      await form.validateFields();
    } catch (error) {
      antdMessage.error('Vui lòng điền đầy đủ số quyết định và upload file PDF');
      return;
    }

    const formValues = form.getFieldsValue();

    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            Bạn có chắc chắn muốn phê duyệt đề xuất này? Dữ liệu sẽ được import vào hệ thống.
          </p>
          {(pendingAchievementsCount > 0 || specialProposalsCount > 0) && (
            <div
              style={{
                marginBottom: 8,
                padding: '8px 12px',
                background: '#fff7e6',
                border: '1px solid #ffe7ba',
                borderRadius: 6,
              }}
            >
              <strong>Chú ý:</strong>
              <ul style={{ margin: '6px 0 0 18px' }}>
                {pendingAchievementsCount > 0 && (
                  <li>{pendingAchievementsCount} thành tích đang ở trạng thái Chờ duyệt</li>
                )}
                {specialProposalsCount > 0 && (
                  <li>{specialProposalsCount} mục đề xuất đặc biệt (BKBQP/CSTĐTQ)</li>
                )}
              </ul>
            </div>
          )}
          <Input.TextArea
            placeholder="Ghi chú cho Manager (không bắt buộc)"
            rows={3}
            value={ghiChu}
            onChange={e => setGhiChu(e.target.value)}
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      width: 500,
      onOk: async () => {
        try {
          setApproving(true);
          setMessage(null);

          // Create FormData để gửi file
          const formData = new FormData();
          formData.append('data_danh_hieu', JSON.stringify(editedDanhHieu));
          formData.append('data_thanh_tich', JSON.stringify(editedThanhTich));

          // Thêm ghi chú nếu có
          if (ghiChu.trim()) {
            formData.append('ghi_chu', ghiChu.trim());
          }

          // Thêm số quyết định
          if (formValues.so_quyet_dinh_cstt) {
            formData.append('so_quyet_dinh_cstt', formValues.so_quyet_dinh_cstt);
          }
          if (formValues.so_quyet_dinh_cstdcs) {
            formData.append('so_quyet_dinh_cstdcs', formValues.so_quyet_dinh_cstdcs);
          }
          if (formValues.so_quyet_dinh_bkbqp) {
            formData.append('so_quyet_dinh_bkbqp', formValues.so_quyet_dinh_bkbqp);
          }
          if (formValues.so_quyet_dinh_cstdtq) {
            formData.append('so_quyet_dinh_cstdtq', formValues.so_quyet_dinh_cstdtq);
          }

          // Thêm file PDF
          if (fileListCSTT.length > 0 && fileListCSTT[0].originFileObj) {
            formData.append('file_pdf_cstt', fileListCSTT[0].originFileObj);
          }
          if (fileListCSTDCS.length > 0 && fileListCSTDCS[0].originFileObj) {
            formData.append('file_pdf_cstdcs', fileListCSTDCS[0].originFileObj);
          }
          if (fileListBKBQP.length > 0 && fileListBKBQP[0].originFileObj) {
            formData.append('file_pdf_bkbqp', fileListBKBQP[0].originFileObj);
          }
          if (fileListCSTDTQ.length > 0 && fileListCSTDTQ[0].originFileObj) {
            formData.append('file_pdf_cstdtq', fileListCSTDTQ[0].originFileObj);
          }

          const response = await apiClient.approveProposal(String(id), formData);

          if (response.success) {
            const importedData = response.data || {};
            setMessage({
              type: 'success',
              text: `${response.message || 'Đã phê duyệt đề xuất'}. Đã import ${
                importedData.imported_danh_hieu || 0
              }/${importedData.total_danh_hieu || 0} danh hiệu và ${
                importedData.imported_thanh_tich || 0
              }/${importedData.total_thanh_tich || 0} thành tích.`,
            });

            // Refresh data
            await fetchProposalDetail();

            // Redirect sau 3 giây
            setTimeout(() => {
              router.push('/admin/proposals/review');
            }, 3000);
          } else {
            setMessage({ type: 'error', text: response.message || 'Lỗi khi phê duyệt đề xuất' });
          }
        } catch (error: any) {
          setMessage({ type: 'error', text: error.message || 'Lỗi khi phê duyệt đề xuất' });
        } finally {
          setApproving(false);
        }
      },
    });
  };

  const updateDanhHieu = (index: number, field: keyof DanhHieuItem, value: any) => {
    const newData = [...editedDanhHieu];
    newData[index] = { ...newData[index], [field]: value };
    setEditedDanhHieu(newData);
  };

  const updateThanhTich = (index: number, field: keyof ThanhTichItem, value: any) => {
    const newData = [...editedThanhTich];
    newData[index] = { ...newData[index], [field]: value };
    setEditedThanhTich(newData);
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Space>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <span style={{ color: '#666' }}>Đang tải...</span>
        </Space>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Không tìm thấy đề xuất"
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
        />
      </div>
    );
  }

  const danhHieuColumns = [
    {
      title: 'CCCD',
      dataIndex: 'cccd',
      key: 'cccd',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{text}</span>
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.nam}
          type="number"
          onSave={val => updateDanhHieu(index, 'nam', parseInt(val))}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 120,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.danh_hieu || ''}
          type="select"
          options={[
            { label: 'CSTDCS', value: 'CSTDCS' },
            { label: 'CSTT', value: 'CSTT' },
            { label: 'Không đạt', value: '' },
          ]}
          onSave={val => updateDanhHieu(index, 'danh_hieu', val || null)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'BKBQP',
      dataIndex: 'nhan_bkbqp',
      key: 'nhan_bkbqp',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.nhan_bkbqp}
          type="checkbox"
          onSave={val => updateDanhHieu(index, 'nhan_bkbqp', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Số QĐ BKBQP',
      dataIndex: 'so_quyet_dinh_bkbqp',
      key: 'so_quyet_dinh_bkbqp',
      width: 150,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.so_quyet_dinh_bkbqp}
          type="text"
          onSave={val => updateDanhHieu(index, 'so_quyet_dinh_bkbqp', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'CSTĐTQ',
      dataIndex: 'nhan_cstdtq',
      key: 'nhan_cstdtq',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.nhan_cstdtq}
          type="checkbox"
          onSave={val => updateDanhHieu(index, 'nhan_cstdtq', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Số QĐ CSTĐTQ',
      dataIndex: 'so_quyet_dinh_cstdtq',
      key: 'so_quyet_dinh_cstdtq',
      width: 150,
      render: (_: any, record: DanhHieuItem, index: number) => (
        <EditableCell
          value={record.so_quyet_dinh_cstdtq}
          type="text"
          onSave={val => updateDanhHieu(index, 'so_quyet_dinh_cstdtq', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Chú ý',
      key: 'note',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: DanhHieuItem) =>
        record.nhan_bkbqp || record.nhan_cstdtq ? <Tag color="red">Đề xuất đặc biệt</Tag> : null,
    },
  ];

  const thanhTichColumns = [
    {
      title: 'CCCD',
      dataIndex: 'cccd',
      key: 'cccd',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{text}</span>
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.nam}
          type="number"
          onSave={val => updateThanhTich(index, 'nam', parseInt(val))}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'loai',
      key: 'loai',
      width: 100,
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.loai}
          type="select"
          options={[
            { label: 'NCKH', value: 'NCKH' },
            { label: 'SKKH', value: 'SKKH' },
          ]}
          onSave={val => updateThanhTich(index, 'loai', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'mo_ta',
      key: 'mo_ta',
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.mo_ta}
          type="text"
          onSave={val => updateThanhTich(index, 'mo_ta', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_: any, record: ThanhTichItem, index: number) => (
        <EditableCell
          value={record.status}
          type="select"
          options={[
            { label: 'Đã duyệt', value: 'APPROVED' },
            { label: 'Chờ duyệt', value: 'PENDING' },
          ]}
          onSave={val => updateThanhTich(index, 'status', val)}
          editable={proposal.status === 'PENDING'}
        />
      ),
    },
  ];

  // Cảnh báo khi có dữ liệu chưa đủ điều kiện/đang chờ
  const pendingAchievementsCount = (proposal?.data_thanh_tich || []).filter(
    (t: any) => t.status !== 'APPROVED'
  ).length;
  const specialProposalsCount = (proposal?.data_danh_hieu || []).filter(
    (d: any) => d.nhan_bkbqp || d.nhan_cstdtq
  ).length;

  const tabItems = [
    {
      key: 'danh_hieu',
      label: (
        <span>
          <TrophyOutlined style={{ marginRight: 8 }} />
          Danh Hiệu ({editedDanhHieu.length})
        </span>
      ),
      children: (
        <Card
          title="Danh Hiệu Hằng Năm"
          extra={
            <Text type="secondary">
              Bảng có thể chỉnh sửa. Nhấp vào ô để sửa. Checkbox tự động cập nhật.
            </Text>
          }
        >
          {editedDanhHieu.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu danh hiệu"
            />
          ) : (
            <Table
              columns={danhHieuColumns}
              dataSource={editedDanhHieu}
              rowKey={(_, index) => `danh_hieu_${index}`}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'thanh_tich',
      label: (
        <span>
          <BookOutlined style={{ marginRight: 8 }} />
          Thành Tích ({editedThanhTich.length})
        </span>
      ),
      children: (
        <Card
          title="Thành Tích Khoa Học"
          extra={<Text type="secondary">Bảng có thể chỉnh sửa. Nhấp vào ô để sửa.</Text>}
        >
          {editedThanhTich.length === 0 ? (
            <Empty
              image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="Không có dữ liệu thành tích"
            />
          ) : (
            <Table
              columns={thanhTichColumns}
              dataSource={editedThanhTich}
              rowKey={(_, index) => `thanh_tich_${index}`}
              pagination={false}
              scroll={{ x: true }}
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/admin/proposals/review">Duyệt Đề Xuất</Breadcrumb.Item>
        <Breadcrumb.Item>Chi Tiết #{proposal.id}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/proposals/review')}
          style={{ marginBottom: '16px' }}
        >
          Quay lại
        </Button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Title level={2}>Chi Tiết Đề Xuất #{proposal.id}</Title>
            <Paragraph>Xem và chỉnh sửa trước khi phê duyệt</Paragraph>
          </div>
          {proposal.status === 'APPROVED' ? (
            <Badge status="success" text="Đã phê duyệt" />
          ) : (
            <Badge status="warning" text="Đang chờ duyệt" />
          )}
        </div>
      </div>

      {(message || pendingAchievementsCount > 0 || specialProposalsCount > 0) && (
        <Alert
          message={
            message?.text ||
            `Chú ý: ${pendingAchievementsCount} thành tích chưa được phê duyệt và ${specialProposalsCount} mục đề xuất đặc biệt (BKBQP/CSTĐTQ).`
          }
          type={message?.type || 'warning'}
          showIcon
          closable
          onClose={() => (message ? setMessage(null) : null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card title="Thông tin chung" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Đơn vị
            </Text>
            <div style={{ fontWeight: 500 }}>
              {proposal.don_vi.ten_don_vi} ({proposal.don_vi.ma_don_vi})
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Người đề xuất
            </Text>
            <div style={{ fontWeight: 500 }}>{proposal.nguoi_de_xuat.ho_ten}</div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Ngày gửi
            </Text>
            <div style={{ fontWeight: 500 }}>
              {format(new Date(proposal.createdAt), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
          {proposal.ten_file_pdf && (
            <div>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                File PDF Quyết định
              </Text>
              <div>
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  href={`${BASE_URL}/api/proposals/uploads/${proposal.ten_file_pdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: 0 }}
                >
                  Xem PDF <ExportOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {proposal.status === 'PENDING' && (
        <Card
          title={
            <Space>
              <FilePdfOutlined style={{ color: '#1890ff' }} />
              <span>Quyết định khen thưởng</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Alert
            message="Quan trọng"
            description="Vui lòng nhập số quyết định và upload file PDF cho từng loại danh hiệu. Hệ thống sẽ tự động gán cho quân nhân theo danh hiệu của họ."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form form={form} layout="vertical">
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Danh hiệu hằng năm</Title>
              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {/* CSTT */}
                <Card
                  size="small"
                  title="CSTT - Chiến sĩ tiên tiến"
                  style={{ backgroundColor: '#f6ffed' }}
                >
                  <Form.Item
                    name="so_quyet_dinh_cstt"
                    label="Số quyết định"
                    rules={[{ required: true, message: 'Vui lòng nhập số QĐ' }]}
                  >
                    <Input placeholder="VD: 123/QĐ-BQP" prefix={<FileTextOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label="File PDF"
                    rules={[{ required: true, message: 'Vui lòng upload file PDF' }]}
                  >
                    <Upload
                      fileList={fileListCSTT}
                      onChange={({ fileList }) => setFileListCSTT(fileList)}
                      beforeUpload={() => false}
                      accept=".pdf"
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} block>
                        Upload PDF
                      </Button>
                    </Upload>
                  </Form.Item>
                </Card>

                {/* CSTDCS */}
                <Card
                  size="small"
                  title="CSTDCS - Chiến sĩ thi đua cơ sở"
                  style={{ backgroundColor: '#e6f7ff' }}
                >
                  <Form.Item
                    name="so_quyet_dinh_cstdcs"
                    label="Số quyết định"
                    rules={[{ required: true, message: 'Vui lòng nhập số QĐ' }]}
                  >
                    <Input placeholder="VD: 124/QĐ-BQP" prefix={<FileTextOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label="File PDF"
                    rules={[{ required: true, message: 'Vui lòng upload file PDF' }]}
                  >
                    <Upload
                      fileList={fileListCSTDCS}
                      onChange={({ fileList }) => setFileListCSTDCS(fileList)}
                      beforeUpload={() => false}
                      accept=".pdf"
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} block>
                        Upload PDF
                      </Button>
                    </Upload>
                  </Form.Item>
                </Card>
              </div>
            </div>

            <div>
              <Title level={5}>Khen thưởng đặc biệt (Tự động tính)</Title>
              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {/* BKBQP */}
                <Card
                  size="small"
                  title="BKBQP - Bằng khen BQP"
                  style={{ backgroundColor: '#fff7e6' }}
                >
                  <Form.Item name="so_quyet_dinh_bkbqp" label="Số quyết định">
                    <Input placeholder="VD: 125/QĐ-BQP" prefix={<FileTextOutlined />} />
                  </Form.Item>
                  <Form.Item label="File PDF">
                    <Upload
                      fileList={fileListBKBQP}
                      onChange={({ fileList }) => setFileListBKBQP(fileList)}
                      beforeUpload={() => false}
                      accept=".pdf"
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} block>
                        Upload PDF
                      </Button>
                    </Upload>
                  </Form.Item>
                </Card>

                {/* CSTDTQ */}
                <Card
                  size="small"
                  title="CSTDTQ - Chiến sĩ thi đua Toàn quân"
                  style={{ backgroundColor: '#fff1f0' }}
                >
                  <Form.Item name="so_quyet_dinh_cstdtq" label="Số quyết định">
                    <Input placeholder="VD: 126/QĐ-BQP" prefix={<FileTextOutlined />} />
                  </Form.Item>
                  <Form.Item label="File PDF">
                    <Upload
                      fileList={fileListCSTDTQ}
                      onChange={({ fileList }) => setFileListCSTDTQ(fileList)}
                      beforeUpload={() => false}
                      accept=".pdf"
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} block>
                        Upload PDF
                      </Button>
                    </Upload>
                  </Form.Item>
                </Card>
              </div>
            </div>
          </Form>
        </Card>
      )}

      <Tabs defaultActiveKey="danh_hieu" items={tabItems} />

      <Divider />

      {proposal.status === 'PENDING' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button onClick={() => router.push('/admin/proposals/review')}>Hủy</Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setRejectModalVisible(true)}
            size="large"
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            icon={approving ? <LoadingOutlined /> : <CheckCircleOutlined />}
            onClick={handleApprove}
            loading={approving}
            size="large"
          >
            {approving ? 'Đang phê duyệt...' : 'Phê Duyệt và Import'}
          </Button>
        </div>
      )}

      {/* Modal từ chối */}
      <Modal
        title="Từ chối đề xuất"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setGhiChu('');
        }}
        onOk={handleReject}
        confirmLoading={rejecting}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Alert
          message="Lưu ý"
          description="Vui lòng nhập lý do từ chối để Manager biết và chỉnh sửa lại đề xuất."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          placeholder="Nhập lý do từ chối (bắt buộc)"
          rows={5}
          value={ghiChu}
          onChange={e => setGhiChu(e.target.value)}
          showCount
          maxLength={500}
        />
      </Modal>

      {proposal.status === 'APPROVED' && proposal.nguoi_duyet && (
        <div>
          <Alert
            message={
              <span>
                Đã được phê duyệt bởi{' '}
                <strong>{proposal.nguoi_duyet.ho_ten || proposal.nguoi_duyet.username}</strong> vào{' '}
                {format(new Date(proposal.ngay_duyet!), 'dd/MM/yyyy HH:mm')}
              </span>
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          {proposal.ghi_chu && (
            <Alert
              message="Ghi chú từ Admin"
              description={proposal.ghi_chu}
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}

      {proposal.status === 'REJECTED' && (
        <div>
          <Alert
            message={
              <span>
                Đã bị từ chối bởi{' '}
                <strong>{proposal.nguoi_duyet?.ho_ten || proposal.nguoi_duyet?.username}</strong>{' '}
                vào{' '}
                {proposal.ngay_duyet && format(new Date(proposal.ngay_duyet), 'dd/MM/yyyy HH:mm')}
              </span>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
          />
          {proposal.ghi_chu && (
            <Alert
              message="Lý do từ chối"
              description={proposal.ghi_chu}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
