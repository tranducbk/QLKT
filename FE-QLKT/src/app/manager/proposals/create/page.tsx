"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Upload,
  Form,
  Space,
  Breadcrumb,
  Radio,
  Alert,
  message as antMessage,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  HomeOutlined,
  ClearOutlined,
  TrophyOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { UploadFile } from "antd/es/upload/interface";
import { apiClient } from "@/lib/api-client";

const { Title, Paragraph, Text } = Typography;

type ProposalType = 'CA_NHAN_HANG_NAM' | 'DON_VI_HANG_NAM' | 'NIEN_HAN' | 'CONG_HIEN' | 'DOT_XUAT' | 'NCKH';

export default function CreateProposalPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fileExcel, setFileExcel] = useState<UploadFile[]>([]);
  const [proposalType, setProposalType] = useState<ProposalType>('CA_NHAN_HANG_NAM');
  const [showForm, setShowForm] = useState(false); // Thêm state để kiểm soát hiển thị form

  // Tải file mẫu Excel
  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const blob = await apiClient.getProposalTemplate(proposalType);

      // Download file
      const typeNames: Record<ProposalType, string> = {
        CA_NHAN_HANG_NAM: 'ca_nhan_hang_nam',
        DON_VI_HANG_NAM: 'don_vi_hang_nam',
        NIEN_HAN: 'nien_han',
        CONG_HIEN: 'cong_hien',
        DOT_XUAT: 'dot_xuat',
        NCKH: 'nckh',
      };
      const typeName = typeNames[proposalType];
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mau_de_xuat_${typeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      antMessage.success("Tải file mẫu thành công!");
    } catch (error: any) {
      antMessage.error(error.message || "Lỗi khi tải file mẫu");
    } finally {
      setDownloading(false);
    }
  };

  // Xử lý submit form
  const handleSubmit = async () => {
    // Validation
    if (!fileExcel.length) {
      antMessage.error("Vui lòng chọn file Excel đề xuất");
      return;
    }

    try {
      setLoading(true);

      // Tạo FormData
      const formData = new FormData();
      formData.append("file_excel", fileExcel[0].originFileObj as File);
      formData.append("type", proposalType);

      const result = await apiClient.submitProposal(formData);

      if (!result.success) {
        throw new Error(result.message || "Gửi đề xuất thất bại");
      }

      antMessage.success("Gửi đề xuất thành công! Chờ Admin phê duyệt.");

      // Reset form
      form.resetFields();
      setFileExcel([]);
    } catch (error: any) {
      antMessage.error(error.message || "Lỗi khi gửi đề xuất");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileExcel([]);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: <Link href="/manager/dashboard"><HomeOutlined /></Link>,
          },
          {
            title: 'Tạo Phiếu Đề Xuất Khen Thưởng',
          },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Tạo Phiếu Đề Xuất Khen Thưởng</Title>
        <Paragraph type="secondary">
          Chọn loại khen thưởng và điền thông tin đề xuất
        </Paragraph>
      </div>

      {/* Chọn loại đề xuất */}
      <Card
        style={{ marginBottom: 24 }}
        title="Chọn loại đề xuất khen thưởng"
      >
        <Radio.Group
          value={proposalType}
          onChange={(e) => {
            setProposalType(e.target.value);
            // Reset file và ẩn form khi đổi loại đề xuất
            setFileExcel([]);
            setShowForm(false);
          }}
          size="large"
          style={{ width: '100%' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Radio.Button value="CA_NHAN_HANG_NAM" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrophyOutlined style={{ fontSize: 20, color: proposalType === 'CA_NHAN_HANG_NAM' ? '#1890ff' : '#8c8c8c' }} />
                  <Text strong style={{ fontSize: 16 }}>Cá nhân Hằng năm</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginLeft: 28 }}>
                  Danh hiệu CSTT-CS, CSTĐ-CS, BK-BQP, CSTĐ-TQ (4 loại)
                </Text>
              </Space>
            </Radio.Button>

            <Radio.Button value="DON_VI_HANG_NAM" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined style={{ fontSize: 20, color: proposalType === 'DON_VI_HANG_NAM' ? '#1890ff' : '#8c8c8c' }} />
                  <Text strong style={{ fontSize: 16 }}>Đơn vị Hằng năm</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginLeft: 28 }}>
                  ĐVTT, ĐVQT, BK-BQP, BK-TTCP (4 loại)
                </Text>
              </Space>
            </Radio.Button>

            <Radio.Button value="NIEN_HAN" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ fontSize: 20, color: proposalType === 'NIEN_HAN' ? '#1890ff' : '#8c8c8c' }} />
                  <Text strong style={{ fontSize: 16 }}>Niên hạn</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginLeft: 28 }}>
                  HCCSVV 3 hạng, HC Quân kỳ, Kỷ niệm chương (6 loại)
                </Text>
              </Space>
            </Radio.Button>

            <Radio.Button value="CONG_HIEN" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeartOutlined style={{ fontSize: 20, color: proposalType === 'CONG_HIEN' ? '#1890ff' : '#8c8c8c' }} />
                  <Text strong style={{ fontSize: 16 }}>Cống hiến</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginLeft: 28 }}>
                  HC BVTQ hạng Nhất, Nhì, Ba (3 loại)
                </Text>
              </Space>
            </Radio.Button>

            <Radio.Button value="NCKH" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ExperimentOutlined style={{ fontSize: 20, color: proposalType === 'NCKH' ? '#1890ff' : '#8c8c8c' }} />
                  <Text strong style={{ fontSize: 16 }}>NCKH/SKKH</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginLeft: 28 }}>
                  Thành tích Nghiên cứu Khoa học và Sáng kiến Kinh nghiệm (2 loại)
                </Text>
              </Space>
            </Radio.Button>
          </Space>
        </Radio.Group>

        {proposalType === 'CA_NHAN_HANG_NAM' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất Cá nhân Hằng năm"
            description="Áp dụng cho khen thưởng cá nhân hằng năm: Chiến sĩ thi đua cơ sở (CSTT-CS), Chiến sĩ tiên đến cơ sở (CSTĐ-CS), Bằng khen BQP (BK-BQP), Chiến sĩ tiên đến toàn quân (CSTĐ-TQ)."
            type="info"
            showIcon
          />
        )}

        {proposalType === 'DON_VI_HANG_NAM' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất Đơn vị Hằng năm"
            description="Áp dụng cho khen thưởng đơn vị hằng năm: Đơn vị tiên tiến (ĐVTT), Đơn vị quyết thắng (ĐVQT), Bằng khen BQP (BK-BQP), Bằng khen Thủ tướng Chính phủ (BK-TTCP)."
            type="info"
            showIcon
          />
        )}

        {proposalType === 'NIEN_HAN' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất Niên hạn"
            description="Áp dụng cho khen thưởng theo thâm niên phục vụ: Huân chương Chiến sĩ vẻ vang hạng Nhất, Nhì, Ba (HCCSVV), Huân chương Quân kỳ, Kỷ niệm chương các hạng."
            type="info"
            showIcon
          />
        )}

        {proposalType === 'CONG_HIEN' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất Cống hiến"
            description="Áp dụng cho khen thưởng theo cống hiến: Huân chương Bảo vệ Tổ quốc hạng Nhất, Nhì, Ba (HC BVTQ)."
            type="info"
            showIcon
          />
        )}

        {proposalType === 'DOT_XUAT' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất Đột xuất"
            description="Áp dụng cho khen thưởng đột xuất: Khen thưởng cá nhân hoặc đơn vị có thành tích đột xuất, xuất sắc theo quyết định của cấp có thẩm quyền."
            type="warning"
            showIcon
          />
        )}

        {proposalType === 'NCKH' && (
          <Alert
            style={{ marginTop: 16 }}
            message="Đề xuất NCKH/SKKH"
            description="Áp dụng cho khen thưởng thành tích khoa học: Nghiên cứu Khoa học (NCKH) và Sáng kiến Kinh nghiệm (SKKH)."
            type="success"
            showIcon
          />
        )}

        {/* Nút Tạo đề xuất */}
        {!showForm && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<FileExcelOutlined />}
              onClick={() => setShowForm(true)}
              style={{ minWidth: 200 }}
            >
              Tạo đề xuất
            </Button>
          </div>
        )}
      </Card>

      {/* Form nhập thông tin đề xuất - Hiển thị sau khi bấm "Tạo đề xuất" */}
      {showForm && (
        <>
          {/* Cá nhân Hằng năm */}
          {proposalType === 'CA_NHAN_HANG_NAM' && (
            <Card title="Thông tin đề xuất - Cá nhân Hằng năm" style={{ marginBottom: 24 }}>
              <Alert
                message="Form đề xuất Cá nhân Hằng năm"
                description="Nhập danh sách cá nhân đề xuất CSTT-CS, CSTĐ-CS, BK-BQP, CSTĐ-TQ."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {/* TODO: Thêm form fields ở đây */}
              <Paragraph>Form đang được phát triển...</Paragraph>
            </Card>
          )}

          {/* Đơn vị Hằng năm */}
          {proposalType === 'DON_VI_HANG_NAM' && (
            <Card title="Thông tin đề xuất - Đơn vị Hằng năm" style={{ marginBottom: 24 }}>
              <Alert
                message="Form đề xuất Đơn vị Hằng năm"
                description="Nhập thông tin đơn vị đề xuất ĐVTT, ĐVQT, BK-BQP, BK-TTCP."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {/* TODO: Thêm form fields ở đây */}
              <Paragraph>Form đang được phát triển...</Paragraph>
            </Card>
          )}

          {/* Niên hạn */}
          {proposalType === 'NIEN_HAN' && (
            <Card title="Thông tin đề xuất - Niên hạn" style={{ marginBottom: 24 }}>
              <Alert
                message="Form đề xuất Niên hạn"
                description="Nhập danh sách cá nhân đề xuất HCCSVV, HC Quân kỳ, Kỷ niệm chương."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {/* TODO: Thêm form fields ở đây */}
              <Paragraph>Form đang được phát triển...</Paragraph>
            </Card>
          )}

          {/* Cống hiến */}
          {proposalType === 'CONG_HIEN' && (
            <Card title="Thông tin đề xuất - Cống hiến" style={{ marginBottom: 24 }}>
              <Alert
                message="Form đề xuất Cống hiến"
                description="Nhập danh sách cá nhân đề xuất HC BVTQ hạng Nhất, Nhì, Ba."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {/* TODO: Thêm form fields ở đây */}
              <Paragraph>Form đang được phát triển...</Paragraph>
            </Card>
          )}

          {/* NCKH/SKKH */}
          {proposalType === 'NCKH' && (
            <Card title="Thông tin đề xuất - NCKH/SKKH" style={{ marginBottom: 24 }}>
              <Alert
                message="Form đề xuất NCKH/SKKH"
                description="Nhập thông tin đề xuất khen thưởng thành tích NCKH và SKKH."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {/* TODO: Thêm form fields ở đây */}
              <Paragraph>Form đang được phát triển...</Paragraph>
            </Card>
          )}

          {/* Nút hành động */}
          <Card>
            <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={() => {
                  setShowForm(false);
                  form.resetFields();
                  setFileExcel([]);
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<UploadOutlined />}
                loading={loading}
                onClick={handleSubmit}
              >
                Gửi đề xuất
              </Button>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}
