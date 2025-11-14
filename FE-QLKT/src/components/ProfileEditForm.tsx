'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, DatePicker, Button, Spin, Alert, message, Divider } from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  CalendarOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  TeamOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import VietnamAddressCascader from './VietnamAddressCascader';

// Helper function để hiển thị tên quyền
const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: 'Quản trị viên hệ thống',
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    USER: 'Người dùng',
  };
  return roleMap[role] || role;
};

// Helper function để parse địa chỉ từ string sang array
const parseAddressToArray = (addressString: string | null): string[] | undefined => {
  if (!addressString) return undefined;

  // Parse format: "Xã An Hoà, huyện Yên Bình, tỉnh Nam Định"
  // hoặc "Phường Hoà An, quận Ba Đình, Thành phố Hà Nội"
  const parts = addressString.split(',').map(part => part.trim());

  if (parts.length !== 3) return undefined;

  // Trong JSON, Name có đầy đủ prefix, ví dụ:
  // - Province: "Thành phố Hà Nội", "Tỉnh Ninh Bình"
  // - District: "Quận Ba Đình", "Huyện Yên Bình"
  // - Ward: "Phường Phúc Xá", "Xã An Hoà"
  const ward = parts[0];
  const district = parts[1];
  const province = parts[2];

  return [province, district, ward];
};

// Helper function để convert array sang string
const formatAddressToString = (addressArray: string[]): string => {
  if (!addressArray || addressArray.length !== 3) return '';

  const [province, district, ward] = addressArray;
  return `${ward}, ${district}, ${province}`;
};

// Helper function để format địa chỉ 2 cấp
// Cấu trúc: [từ hành chính] + [tên địa danh]
// Examples:
// - "phường lào cai, tỉnh lào cai" → "phường Lào Cai, tỉnh Lào Cai"
// - "xã hoà an, tỉnh ninh bình" → "xã Hoà An, tỉnh Ninh Bình"
// - "xã an hoà, huyện yên bình, tỉnh nam định" → "xã An Hoà, huyện Yên Bình, tỉnh Nam Định"
const formatAddressInput = (input: string): string => {
  if (!input || !input.trim()) return input;

  // Danh sách các từ hành chính (giữ viết thường)
  const singleAdminWords = ['tỉnh', 'tp', 'tp.', 'huyện', 'quận', 'xã', 'phường', 'tt', 'tt.'];
  const doubleAdminWords = ['thành phố', 'thị xã', 'thị trấn'];

  // Tách thành các phần bởi dấu phẩy
  const parts = input.split(',').map((part) => part.trim());

  const formattedParts = parts.map((part) => {
    const words = part.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return '';

    const firstWord = words[0].toLowerCase();
    const secondWord = words[1]?.toLowerCase();

    let adminLength = 0; // Số từ là từ hành chính
    let formattedAdmin = '';

    // Kiểm tra từ hành chính 2 chữ (thành phố, thị xã, thị trấn)
    if (secondWord && doubleAdminWords.includes(`${firstWord} ${secondWord}`)) {
      adminLength = 2;
      formattedAdmin = `${firstWord} ${secondWord}`;
    }
    // Kiểm tra từ hành chính 1 chữ (tỉnh, huyện, quận, xã, phường)
    else if (singleAdminWords.includes(firstWord)) {
      adminLength = 1;
      formattedAdmin = firstWord;
    }

    // Nếu có từ hành chính
    if (adminLength > 0) {
      // Lấy phần còn lại là tên địa danh
      const placeNameWords = words.slice(adminLength);

      // Viết hoa chữ đầu mỗi từ của địa danh
      const formattedPlaceName = placeNameWords
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return `${formattedAdmin} ${formattedPlaceName}`;
    }

    // Nếu không có từ hành chính, viết hoa tất cả
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  return formattedParts.join(', ');
};

export default function ProfileEditForm() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personnelData, setPersonnelData] = useState<any>(null);
  const [showTempCCCDWarning, setShowTempCCCDWarning] = useState(false);

  // Handler để format địa chỉ khi người dùng rời khỏi input
  const handleAddressBlur = (fieldName: string) => {
    const currentValue = form.getFieldValue(fieldName);
    if (currentValue && typeof currentValue === 'string') {
      const formatted = formatAddressInput(currentValue);
      if (formatted !== currentValue) {
        form.setFieldValue(fieldName, formatted);
      }
    }
  };

  useEffect(() => {
    loadPersonnelData();
  }, []);

  const loadPersonnelData = async () => {
    try {
      setLoading(true);

      // Lấy thông tin user từ token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        router.push('/login');
        return;
      }

      // Decode JWT để lấy quan_nhan_id
      const payload = JSON.parse(atob(token.split('.')[1]));
      const { quan_nhan_id } = payload;

      if (!quan_nhan_id) {
        message.error('Không tìm thấy thông tin quân nhân');
        return;
      }

      // Lấy thông tin personnel
      const response = await apiClient.getPersonnelById(String(quan_nhan_id));

      if (response.success && response.data) {
        setPersonnelData(response.data);

        // Kiểm tra CCCD tạm thời
        if (response.data.cccd?.startsWith('TEMP-')) {
          setShowTempCCCDWarning(true);
        }

        // Set form values
        form.setFieldsValue({
          ho_ten: response.data.ho_ten,
          cccd: response.data.cccd,
          ngay_sinh: response.data.ngay_sinh ? dayjs(response.data.ngay_sinh) : null,
          ngay_nhap_ngu: response.data.ngay_nhap_ngu ? dayjs(response.data.ngay_nhap_ngu) : null,
          ngay_xuat_ngu: response.data.ngay_xuat_ngu ? dayjs(response.data.ngay_xuat_ngu) : null,
          que_quan_2_cap: response.data.que_quan_2_cap,
          que_quan_3_cap: parseAddressToArray(response.data.que_quan_3_cap),
          tru_quan: response.data.tru_quan,
          cho_o_hien_nay: response.data.cho_o_hien_nay,
          ngay_vao_dang: response.data.ngay_vao_dang ? dayjs(response.data.ngay_vao_dang) : null,
          ngay_vao_dang_chinh_thuc: response.data.ngay_vao_dang_chinh_thuc
            ? dayjs(response.data.ngay_vao_dang_chinh_thuc)
            : null,
          so_the_dang_vien: response.data.so_the_dang_vien,
          so_dien_thoai: response.data.so_dien_thoai,
          co_quan_don_vi: response.data.CoQuanDonVi?.ten_don_vi || 'Chưa có thông tin',
          don_vi_truc_thuoc: response.data.DonViTrucThuoc?.ten_don_vi || 'Chưa có thông tin',
          chuc_vu: response.data.ChucVu?.ten_chuc_vu || 'Chưa có thông tin',
          role: getRoleName(response.data.TaiKhoan?.role || 'USER'),
        });
      }
    } catch (error: any) {
      console.error('Load personnel error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể tải thông tin cá nhân';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (!personnelData?.id) {
        message.error('Không tìm thấy ID quân nhân');
        return;
      }

      // Chuẩn bị dữ liệu
      const payload = {
        ho_ten: values.ho_ten,
        cccd: values.cccd,
        ngay_sinh: values.ngay_sinh ? dayjs(values.ngay_sinh).format('YYYY-MM-DD') : null,
        ngay_nhap_ngu: values.ngay_nhap_ngu
          ? dayjs(values.ngay_nhap_ngu).format('YYYY-MM-DD')
          : null,
        ngay_xuat_ngu: values.ngay_xuat_ngu
          ? dayjs(values.ngay_xuat_ngu).format('YYYY-MM-DD')
          : null,
        que_quan_2_cap: values.que_quan_2_cap || null,
        que_quan_3_cap: values.que_quan_3_cap ? formatAddressToString(values.que_quan_3_cap) : null,
        tru_quan: values.tru_quan || null,
        cho_o_hien_nay: values.cho_o_hien_nay || null,
        ngay_vao_dang: values.ngay_vao_dang
          ? dayjs(values.ngay_vao_dang).format('YYYY-MM-DD')
          : null,
        ngay_vao_dang_chinh_thuc: values.ngay_vao_dang_chinh_thuc
          ? dayjs(values.ngay_vao_dang_chinh_thuc).format('YYYY-MM-DD')
          : null,
        so_the_dang_vien: values.so_the_dang_vien || null,
        so_dien_thoai: values.so_dien_thoai || null,
        co_quan_don_vi_id: personnelData.CoQuanDonVi?.id || personnelData.co_quan_don_vi_id,
        don_vi_truc_thuoc_id:
          personnelData.DonViTrucThuoc?.id || personnelData.don_vi_truc_thuoc_id,
        chuc_vu_id: personnelData.ChucVu?.id || personnelData.chuc_vu_id,
      };

      // Gọi API update
      const response = await apiClient.updatePersonnel(String(personnelData.id), payload);

      if (response.success) {
        message.success('Cập nhật thông tin thành công!');

        // Ẩn cảnh báo CCCD tạm nếu đã cập nhật
        if (!values.cccd?.startsWith('TEMP-')) {
          setShowTempCCCDWarning(false);
        }

        // Reload data
        await loadPersonnelData();
      } else {
        message.error(response.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Đã xảy ra lỗi khi cập nhật';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-2xl" />
            <span className="text-2xl font-bold">Thông tin cá nhân</span>
          </div>
        }
        className="shadow-lg"
      >
        <p className="text-gray-600 mb-6">
          Vui lòng cập nhật đầy đủ thông tin cá nhân, đặc biệt là <strong>CCCD</strong>,{' '}
          <strong>Ngày nhập ngũ</strong> và các thông tin địa chỉ, Đảng để hệ thống tính toán khen
          thưởng chính xác.
        </p>

        {showTempCCCDWarning && (
          <Alert
            message="Cảnh báo: CCCD chưa được cập nhật"
            description="Bạn đang sử dụng CCCD tạm thời. Vui lòng cập nhật CCCD chính thức của bạn ngay."
            type="warning"
            showIcon
            closable
            className="mb-6"
            onClose={() => setShowTempCCCDWarning(false)}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Thông tin cơ bản */}
          <Divider orientation="left">
            <span className="text-lg font-semibold flex items-center gap-2">
              <UserOutlined className="text-blue-500" />
              Thông tin cơ bản
            </span>
          </Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Form.Item
              label="Họ và tên"
              name="ho_ten"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập họ và tên"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="Số CCCD/CMND (không bắt buộc)"
              name="cccd"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve(); // Cho phép để trống
                    if (/^[0-9]{9,12}$/.test(value)) {
                      return Promise.resolve();
                    }
                    if (value.startsWith('TEMP-')) {
                      return Promise.resolve(); // Cho phép CCCD tạm thời
                    }
                    return Promise.reject(new Error('CCCD phải là số từ 9-12 chữ số!'));
                  },
                },
              ]}
            >
              <Input
                prefix={<IdcardOutlined />}
                placeholder="Nhập số CCCD/CMND (không bắt buộc)"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item label="Ngày sinh" name="ngay_sinh">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                size="large"
                className="w-full rounded-lg"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="so_dien_thoai">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Nhập số điện thoại"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </div>

          {/* Thông tin địa chỉ */}
          <Divider orientation="left">
            <span className="text-lg font-semibold flex items-center gap-2">
              <EnvironmentOutlined className="text-green-500" />
              Thông tin địa chỉ
            </span>
          </Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Form.Item
              label="Quê quán (2 cấp)"
              name="que_quan_2_cap"
              tooltip="Nhập địa chỉ, hệ thống sẽ tự động định dạng (VD: xã hoà an, tỉnh ninh bình → Xã Hoà An, tỉnh Ninh Bình)"
            >
              <Input.TextArea
                placeholder="Ví dụ: xã hoà an, tỉnh ninh bình"
                size="large"
                className="rounded-lg"
                rows={1}
                onBlur={() => handleAddressBlur('que_quan_2_cap')}
              />
            </Form.Item>

            <Form.Item label="Quê quán (3 cấp)" name="que_quan_3_cap">
              <VietnamAddressCascader
                placeholder="Chọn Tỉnh/Thành phố, Quận/Huyện, Xã/Phường"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="Trú quán"
              name="tru_quan"
              tooltip="Nhập địa chỉ, hệ thống sẽ tự động định dạng"
            >
              <Input.TextArea
                placeholder="Ví dụ: phường lào cai, tỉnh lào cai"
                size="large"
                className="rounded-lg"
                rows={1}
                onBlur={() => handleAddressBlur('tru_quan')}
              />
            </Form.Item>

            <Form.Item
              label="Chỗ ở hiện nay"
              name="cho_o_hien_nay"
              tooltip="Nhập địa chỉ, hệ thống sẽ tự động định dạng"
            >
              <Input.TextArea
                placeholder="Ví dụ: xã an hoà, huyện yên bình, tỉnh nam định"
                size="large"
                className="rounded-lg"
                rows={1}
                onBlur={() => handleAddressBlur('cho_o_hien_nay')}
              />
            </Form.Item>
          </div>

          {/* Thông tin công tác */}
          <Divider orientation="left">
            <span className="text-lg font-semibold flex items-center gap-2">
              <BankOutlined className="text-purple-500" />
              Thông tin công tác
            </span>
          </Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Form.Item
              label="Ngày nhập ngũ"
              name="ngay_nhap_ngu"
              rules={[{ required: true, message: 'Vui lòng chọn ngày nhập ngũ!' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày nhập ngũ"
                size="large"
                className="w-full rounded-lg"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>

            <Form.Item label="Ngày xuất ngũ" name="ngay_xuat_ngu">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày xuất ngũ (nếu có)"
                size="large"
                className="w-full rounded-lg"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Quyền hạn"
              name="role"
              extra={
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <InfoCircleOutlined className="text-amber-500" />
                  Chỉ quản trị viên mới có thể thay đổi quyền
                </span>
              }
            >
              <Input disabled size="large" className="rounded-lg bg-gray-50" />
            </Form.Item>

            <Form.Item
              label="Cơ quan đơn vị"
              name="co_quan_don_vi"
              extra={
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <InfoCircleOutlined className="text-amber-500" />
                  Chỉ quản trị viên mới có thể thay đổi cơ quan đơn vị
                </span>
              }
            >
              <Input disabled size="large" className="rounded-lg bg-gray-50" />
            </Form.Item>

            <Form.Item
              label="Đơn vị trực thuộc"
              name="don_vi_truc_thuoc"
              extra={
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <InfoCircleOutlined className="text-amber-500" />
                  Chỉ quản trị viên mới có thể thay đổi đơn vị trực thuộc
                </span>
              }
            >
              <Input disabled size="large" className="rounded-lg bg-gray-50" />
            </Form.Item>

            <Form.Item
              label="Chức vụ"
              name="chuc_vu"
              extra={
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <InfoCircleOutlined className="text-amber-500" />
                  Chỉ quản trị viên mới có thể thay đổi chức vụ
                </span>
              }
            >
              <Input disabled size="large" className="rounded-lg bg-gray-50" />
            </Form.Item>
          </div>

          {/* Thông tin Đảng */}
          <Divider orientation="left">
            <span className="text-lg font-semibold flex items-center gap-2">
              <TeamOutlined className="text-red-500" />
              Thông tin Đảng
            </span>
          </Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Form.Item label="Ngày vào Đảng" name="ngay_vao_dang">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày vào Đảng"
                size="large"
                className="w-full rounded-lg"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>

            <Form.Item label="Ngày vào Đảng chính thức" name="ngay_vao_dang_chinh_thuc">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày vào Đảng chính thức"
                size="large"
                className="w-full rounded-lg"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>

            <Form.Item label="Số thẻ Đảng viên" name="so_the_dang_vien">
              <Input
                prefix={<IdcardOutlined />}
                placeholder="Nhập số thẻ Đảng viên"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </div>

          {/* Submit Button */}
          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                className="w-full md:w-auto min-w-[200px] rounded-lg h-12 text-lg font-semibold"
              >
                Cập nhật thông tin
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
