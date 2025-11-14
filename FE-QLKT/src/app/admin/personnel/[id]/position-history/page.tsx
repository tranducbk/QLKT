'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Breadcrumb,
  Popconfirm,
  message,
  Spin,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  LeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { calculateDuration, formatDate } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

interface HistoryRecord {
  id: string;
  chuc_vu_id: number;
  chuc_vu_name: string;
  ngay_bat_dau: string;
  ngay_ket_thuc?: string;
}

export default function PositionHistoryPage() {
  const params = useParams();
  const personnelId = params?.id as string;
  const { theme } = useTheme();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<any>(null);
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [positions, setPositions] = useState([]);
  const [units, setUnits] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [personnelId]);

  async function loadData() {
    try {
      setLoading(true);
      const [personnelRes, historiesRes, positionsRes, unitsRes] = await Promise.all([
        apiClient.getPersonnelById(personnelId),
        apiClient.getPositionHistory(personnelId),
        apiClient.getPositions(),
        apiClient.getUnits(),
      ]);

      if (personnelRes.success) {
        setPersonnel(personnelRes.data);
      }
      if (historiesRes.success) {
        // Map data để có chuc_vu_name từ ChucVu relation
        const mappedHistories = (historiesRes.data || []).map((h: any) => ({
          ...h,
          chuc_vu_name: h.ChucVu?.ten_chuc_vu || '-',
        }));
        setHistories(mappedHistories);
      }
      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }
      if (unitsRes.success) {
        setUnits(unitsRes.data || []);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (history?: any) => {
    if (history) {
      setEditingHistory(history);
      // Format dates to YYYY-MM-DD for input type="date"
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      form.setFieldsValue({
        chuc_vu_id: history.chuc_vu_id?.toString(),
        ngay_bat_dau: formatDateForInput(history.ngay_bat_dau),
        ngay_ket_thuc: history.ngay_ket_thuc ? formatDateForInput(history.ngay_ket_thuc) : '',
        he_so_luong: history.he_so_luong || 0,
      });
    } else {
      setEditingHistory(null);
      form.resetFields();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHistory(null);
    form.resetFields();
  };

  const onSubmit = async (values: any) => {
    try {
      setSubmitting(true);

      const payload = {
        chuc_vu_id: values.chuc_vu_id, // UUID string, không cần parseInt
        ngay_bat_dau: values.ngay_bat_dau,
        ngay_ket_thuc: values.ngay_ket_thuc || undefined,
        he_so_luong: values.he_so_luong || undefined, // Gửi hệ số lương nếu có
      };

      const res = editingHistory
        ? await apiClient.updatePositionHistory(editingHistory.id, payload)
        : await apiClient.createPositionHistory(personnelId, payload);

      if (res.success) {
        message.success(editingHistory ? 'Cập nhật lịch sử thành công' : 'Thêm lịch sử thành công');
        handleCloseDialog();
        loadData();
      } else {
        message.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiClient.deletePositionHistory(deleteId);

      if (res.success) {
        message.success('Xóa lịch sử thành công');
        setDeleteModalOpen(false);
        setDeleteId(null);
        loadData();
      } else {
        message.error(res.message || 'Có lỗi xảy ra khi xóa');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    }
  };

  const columns: TableColumnsType<HistoryRecord> = [
    {
      title: 'Chức vụ',
      dataIndex: 'chuc_vu_name',
      key: 'chuc_vu_name',
      width: 250,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'ngay_bat_dau',
      key: 'ngay_bat_dau',
      width: 150,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'ngay_ket_thuc',
      key: 'ngay_ket_thuc',
      width: 150,
      render: (date: string) => (date ? formatDate(date) : 'Hiện tại'),
    },
    {
      title: 'Thời gian',
      key: 'duration',
      width: 200,
      render: (_, record) => calculateDuration(record.ngay_bat_dau, record.ngay_ket_thuc),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenDialog(record)}
            className="action-btn"
            title="Sửa"
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa lịch sử này?"
            onConfirm={() => {
              setDeleteId(record.id);
              setDeleteModalOpen(true);
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="action-btn"
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div style={{ padding: '24px' }}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item>
            <Link href="/admin/dashboard">
              <HomeOutlined />
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/admin/personnel">Quân nhân</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href={`/admin/personnel/${personnelId}`}>#{personnelId}</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Lịch sử chức vụ</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Space style={{ marginBottom: 8 }}>
              <Link href={`/admin/personnel/${personnelId}`}>
                <Button icon={<LeftOutlined />}>Quay lại</Button>
              </Link>
            </Space>
            <Title level={2} style={{ marginTop: 8, marginBottom: 8 }}>
              Lịch sử chức vụ
            </Title>
            {personnel && (
              <Paragraph style={{ fontSize: 14, color: '#666', marginBottom: 0 }}>
                Quân nhân: {personnel.ho_ten}
              </Paragraph>
            )}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog()}>
            Thêm lịch sử
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#666' }}>Đang tải dữ liệu...</div>
            </div>
          </Card>
        ) : (
          <Card>
            <Table
              columns={columns}
              dataSource={histories}
              rowKey="id"
              pagination={false}
              locale={{
                emptyText: 'Chưa có dữ liệu lịch sử chức vụ',
              }}
            />
          </Card>
        )}

        {/* Form Modal */}
        <Modal
          title={editingHistory ? 'Sửa lịch sử chức vụ' : 'Thêm lịch sử chức vụ mới'}
          open={dialogOpen}
          onCancel={handleCloseDialog}
          footer={null}
          width={600}
        >
          <Form form={form} onFinish={onSubmit} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item
              name="chuc_vu_id"
              label="Chức vụ"
              rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
            >
              <Select
                placeholder="Chọn chức vụ"
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = String(option?.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                onChange={value => {
                  // Khi chọn chức vụ, lấy hệ số lương và lưu vào form
                  const selectedPosition = positions.find(
                    (pos: any) => pos.id.toString() === value
                  );
                  if (selectedPosition) {
                    form.setFieldsValue({
                      he_so_luong: selectedPosition.he_so_luong || 0,
                    });
                  }
                }}
              >
                {positions.map((pos: any) => {
                  // Lấy thông tin đơn vị từ relations (backend đã include)
                  let unitName = '';
                  if (pos.CoQuanDonVi) {
                    // Chức vụ thuộc cơ quan đơn vị
                    unitName = pos.CoQuanDonVi.ten_don_vi;
                  } else if (pos.DonViTrucThuoc) {
                    // Chức vụ thuộc đơn vị trực thuộc
                    const donViName = pos.DonViTrucThuoc.ten_don_vi;
                    const coQuanName = pos.DonViTrucThuoc.CoQuanDonVi?.ten_don_vi;
                    unitName = coQuanName ? `${donViName} (${coQuanName})` : donViName;
                  }

                  const displayText = unitName
                    ? `${pos.ten_chuc_vu} - ${unitName}`
                    : pos.ten_chuc_vu;

                  return (
                    <Select.Option key={pos.id} value={pos.id.toString()}>
                      {displayText}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item name="he_so_luong" label="Hệ số lương" hidden>
              <Input type="hidden" />
            </Form.Item>

            <Form.Item
              name="ngay_bat_dau"
              label="Ngày bắt đầu"
              dependencies={['ngay_ket_thuc']}
              rules={[
                { required: true, message: 'Vui lòng chọn ngày bắt đầu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }
                    const ngayKetThuc = getFieldValue('ngay_ket_thuc');
                    if (ngayKetThuc) {
                      const dateBatDau = dayjs(value);
                      const dateKetThuc = dayjs(ngayKetThuc);

                      // So sánh ngày bắt đầu phải trước ngày kết thúc
                      if (dateBatDau.isAfter(dateKetThuc) || dateBatDau.isSame(dateKetThuc)) {
                        return Promise.reject(new Error('Ngày bắt đầu phải trước ngày kết thúc'));
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input type="date" size="large" />
            </Form.Item>

            <Form.Item
              name="ngay_ket_thuc"
              label="Ngày kết thúc (không bắt buộc)"
              dependencies={['ngay_bat_dau']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }
                    const ngayBatDau = getFieldValue('ngay_bat_dau');
                    if (ngayBatDau) {
                      const dateBatDau = dayjs(ngayBatDau);
                      const dateKetThuc = dayjs(value);

                      // So sánh ngày kết thúc phải sau ngày bắt đầu
                      if (dateKetThuc.isBefore(dateBatDau) || dateKetThuc.isSame(dateBatDau)) {
                        return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input type="date" size="large" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseDialog} disabled={submitting}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {editingHistory ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Xác nhận xóa"
          open={deleteModalOpen}
          onOk={handleDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeleteId(null);
          }}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Paragraph>
            Bạn có chắc chắn muốn xóa lịch sử chức vụ này? Hành động này không thể hoàn tác.
          </Paragraph>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
