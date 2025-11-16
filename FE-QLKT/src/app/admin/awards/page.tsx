'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Tag,
  Alert,
  Space,
  Typography,
  Breadcrumb,
  Spin,
  message,
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  UploadOutlined,
  FileExcelOutlined,
  HomeOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { apiClient } from '@/lib/api-client';

const { Title, Paragraph, Text } = Typography;

interface Award {
  id: number;
  cccd: string;
  ho_ten: string;
  don_vi: string;
  co_quan_don_vi?: string;
  don_vi_truc_thuoc?: string;
  chuc_vu: string;
  nam: number;
  danh_hieu: string | null;
  so_quyet_dinh?: string | null;
  nhan_bkbqp: boolean;
  so_quyet_dinh_bkbqp: string | null;
  nhan_cstdtq: boolean;
  so_quyet_dinh_cstdtq: string | null;
}

export default function AdminAwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: { imported: number; total: number; errors?: string[] };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    nam: '',
    ho_ten: '',
  });

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      if (filters.nam) params.nam = parseInt(filters.nam);
      if (filters.ho_ten) params.ho_ten = filters.ho_ten;

      const result = await apiClient.getAwards(params);
      if (result.success) {
        setAwards(result.data.awards || []);
      }
    } catch (error) {
      console.error('Error fetching awards:', error);
      message.error('Không thể tải danh sách khen thưởng');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params: any = {};
      if (filters.nam) params.nam = parseInt(filters.nam);
      if (filters.ho_ten) params.ho_ten = filters.ho_ten;

      const blob = await apiClient.exportAwards(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh_sach_khen_thuong_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Xuất file thành công');
    } catch (error) {
      console.error('Error exporting awards:', error);
      message.error('Xuất file thất bại');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchAwards();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await apiClient.getAwardsTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mau_import_khen_thuong_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Tải file mẫu thành công');
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('Tải file mẫu thất bại');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      const result = await apiClient.importAwards(file);

      if (result.success) {
        const { imported, total, errors } = result.data;
        setImportResult({
          type: 'success',
          message: `Import thành công ${imported}/${total} bản ghi khen thưởng`,
          details: { imported, total, errors },
        });
        message.success(`Import thành công ${imported}/${total} bản ghi`);
        // Refresh awards list
        await fetchAwards();
      } else {
        setImportResult({
          type: 'error',
          message: result.message || 'Import thất bại',
        });
        message.error(result.message || 'Import thất bại');
      }
    } catch (error: any) {
      console.error('Error importing awards:', error);
      setImportResult({
        type: 'error',
        message: error.message || 'Có lỗi xảy ra khi import file',
      });
      message.error(error.message || 'Có lỗi xảy ra khi import file');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Map danh hiệu codes to full names
  const danhHieuMap: Record<string, string> = {
    CSTDCS: 'Chiến sĩ thi đua cơ sở (CSTDCS)',
    CSTT: 'Chiến sĩ tiên tiến (CSTT)',
    BKBQP: 'Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)',
    CSTDTQ: 'Chiến sĩ thi đua toàn quân (CSTDTQ)',
    ĐVQT: 'Đơn vị Quyết thắng (ĐVQT)',
    ĐVTT: 'Đơn vị Tiên tiến (ĐVTT)',
    BKTTCP: 'Bằng khen Thủ tướng Chính phủ (BKTTCP)',
    HCCSVV_HANG_BA: 'Huân chương Chiến sỹ Vẻ vang Hạng Ba',
    HCCSVV_HANG_NHI: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhì',
    HCCSVV_HANG_NHAT: 'Huân chương Chiến sỹ Vẻ vang Hạng Nhất',
    HCBVTQ_HANG_BA: 'Huân chương Bảo vệ Tổ quốc Hạng Ba',
    HCBVTQ_HANG_NHI: 'Huân chương Bảo vệ Tổ quốc Hạng Nhì',
    HCBVTQ_HANG_NHAT: 'Huân chương Bảo vệ Tổ quốc Hạng Nhất',
  };

  // Determine loại khen thưởng based on danh_hieu
  const getLoaiKhenThuong = (danhHieu: string | null): string => {
    if (!danhHieu) return '-';
    if (danhHieu.startsWith('HCBVTQ')) return 'Cống hiến';
    if (danhHieu.startsWith('HCCSVV')) return 'Niên hạn';
    if (
      danhHieu === 'CSTDCS' ||
      danhHieu === 'CSTT' ||
      danhHieu === 'BKBQP' ||
      danhHieu === 'CSTDTQ'
    ) {
      return 'Cá nhân Hằng năm';
    }
    if (danhHieu === 'ĐVQT' || danhHieu === 'ĐVTT' || danhHieu === 'BKTTCP') {
      return 'Đơn vị Hằng năm';
    }
    return '-';
  };

  const columns: TableColumnsType<Award> = [
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
      width: 200,
      align: 'center',
      render: (text: string, record: Award) => {
        const unitInfo = [];
        if (record.don_vi_truc_thuoc) unitInfo.push(record.don_vi_truc_thuoc);
        if (record.co_quan_don_vi) unitInfo.push(record.co_quan_don_vi);
        const unitInfoText = unitInfo.length > 0 ? unitInfo.join(', ') : record.don_vi || '';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong>{text}</Text>
            {unitInfoText && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                {unitInfoText}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cấp bậc / Chức vụ',
      key: 'cap_bac_chuc_vu',
      width: 150,
      align: 'center',
      render: (_: any, record: any) => {
        const capBac = record.cap_bac;
        const chucVu = record.chuc_vu;
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
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 70,
      align: 'center',
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: 'Loại khen thưởng',
      key: 'loai_khen_thuong',
      width: 140,
      align: 'center',
      render: (_: any, record: Award) => <Text>{getLoaiKhenThuong(record.danh_hieu)}</Text>,
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 220,
      align: 'center',
      render: (text: string | null, record: Award) => {
        if (!text) return <Text type="secondary">-</Text>;
        const fullName = danhHieuMap[text] || text;
        const soQuyetDinh =
          record.so_quyet_dinh || record.so_quyet_dinh_bkbqp || record.so_quyet_dinh_cstdtq;

        return (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            <Text>{fullName}</Text>
            {soQuyetDinh && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Số QĐ: {soQuyetDinh}
              </Text>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Admin</Breadcrumb.Item>
        <Breadcrumb.Item>Quản Lý Khen Thưởng</Breadcrumb.Item>
      </Breadcrumb>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Quản Lý Khen Thưởng
          </Title>
          <Paragraph type="secondary" style={{ marginTop: '4px', marginBottom: 0 }}>
            Danh sách khen thưởng tất cả các đơn vị
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
          size="large"
        >
          {exporting ? 'Đang xuất...' : 'Xuất Excel Tổng Hợp'}
        </Button>
      </div>

      {/* Import Section */}
      <Card
        title={
          <Space>
            <UploadOutlined />
            Import Khen Thưởng
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleDownloadTemplate}
              loading={downloadingTemplate}
            >
              {downloadingTemplate ? 'Đang tải...' : 'Tải File Mẫu Excel'}
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUploadClick}
              loading={importing}
            >
              {importing ? 'Đang import...' : 'Upload File Excel'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Space>

          {importResult && (
            <Alert
              type={importResult.type === 'success' ? 'success' : 'error'}
              message={<Text strong>{importResult.message}</Text>}
              description={
                importResult.details?.errors && importResult.details.errors.length > 0 ? (
                  <div style={{ marginTop: '8px' }}>
                    <Text strong>Lỗi chi tiết:</Text>
                    <ul style={{ marginTop: '4px', marginBottom: 0 }}>
                      {importResult.details.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {importResult.details.errors.length > 5 && (
                        <li style={{ color: '#8c8c8c' }}>
                          ... và {importResult.details.errors.length - 5} lỗi khác
                        </li>
                      )}
                    </ul>
                  </div>
                ) : null
              }
              closable
              onClose={() => setImportResult(null)}
            />
          )}
        </Space>
      </Card>

      {/* Filters */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            Bộ lọc
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Năm
            </Text>
            <Input
              type="number"
              placeholder="Ví dụ: 2024"
              value={filters.nam}
              onChange={e => handleFilterChange('nam', e.target.value)}
              size="large"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Tìm kiếm theo họ tên
            </Text>
            <Input
              placeholder="Nhập tên để tìm kiếm"
              value={filters.ho_ten}
              onChange={e => handleFilterChange('ho_ten', e.target.value)}
              size="large"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleApplyFilters}
              style={{ width: '100%' }}
              size="large"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Card>

      {/* Awards Table */}
      <Card title={`Danh sách khen thưởng (${awards.length})`}>
        <Spin spinning={loading} tip="Đang tải...">
          {!loading && awards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#8c8c8c' }}>
              <p>Chưa có dữ liệu khen thưởng</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={awards}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: total => `Tổng ${total} bản ghi`,
              }}
              bordered
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
