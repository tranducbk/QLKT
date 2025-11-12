"use client"

import { useState, useEffect } from "react"
import { Form, Input, Button, Space, Select, Checkbox, message, Typography } from "antd"
import { apiClient } from "@/lib/api-client"

const { Text } = Typography

interface PositionFormProps {
  position?: any
  units?: any[]
  onSuccess?: () => void
  onClose?: () => void
}

export function PositionForm({ position, units = [], onSuccess, onClose }: PositionFormProps) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (position) {
      form.setFieldsValue({
        don_vi_id: position.don_vi_id?.toString() || undefined,
        ten_chuc_vu: position.ten_chuc_vu || "",
        is_manager: position.is_manager || false,
        he_so_luong: position.he_so_luong || undefined,
      })
    } else if (units.length === 1) {
      // Nếu chỉ có 1 đơn vị (đang tạo từ trang chi tiết), tự động set don_vi_id
      form.setFieldsValue({
        don_vi_id: units[0].id?.toString(),
      })
    }
  }, [position, units, form])

  async function onSubmit(values: any) {
    try {
      setLoading(true)

      // Validate don_vi_id when creating new position (chỉ khi có nhiều đơn vị để chọn)
      if (!position?.id && units.length > 1 && !values.don_vi_id) {
        message.error("Vui lòng chọn đơn vị")
        return
      }

      // Prepare payload
      const payload: any = {
        ten_chuc_vu: values.ten_chuc_vu,
        // Chỉ set is_manager nếu không phải đơn vị trực thuộc hoặc đang sửa
        is_manager: (units.length === 1 && units[0].co_quan_don_vi_id && !position?.id) 
          ? false 
          : (values.is_manager || false),
      }

      // Add optional fields
      if (values.he_so_luong) {
        payload.he_so_luong = parseFloat(values.he_so_luong)
      }

      // Add unit_id only when creating (giữ nguyên string UUID)
      if (!position?.id) {
        // Nếu chỉ có 1 đơn vị (tạo từ trang chi tiết), dùng đơn vị đó
        if (units.length === 1) {
          payload.unit_id = units[0].id.toString()
        } else if (values.don_vi_id) {
          // Nếu có nhiều đơn vị, dùng giá trị từ form
          payload.unit_id = values.don_vi_id.toString()
        }
      }

      let res
      if (position?.id) {
        res = await apiClient.updatePosition(position.id.toString(), payload)
      } else {
        res = await apiClient.createPosition(payload)
      }

      if (res.success) {
        message.success(position?.id ? "Cập nhật chức vụ thành công" : "Tạo chức vụ thành công")
        onSuccess?.()
        onClose?.()
      } else {
        message.error(res.message || "Có lỗi xảy ra")
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || "Có lỗi xảy ra"
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      autoComplete="off"
    >
      <Form.Item
        label="Tên Chức vụ"
        name="ten_chuc_vu"
        rules={[{ required: true, message: 'Vui lòng nhập tên chức vụ' }]}
      >
        <Input placeholder="Nhập tên chức vụ" />
      </Form.Item>

      {!position?.id && (
        <>
          {/* Nếu chỉ có 1 đơn vị (tạo từ trang chi tiết), hiển thị thông tin đơn vị thay vì dropdown */}
          {units.length === 1 ? (
            <>
              {/* Hiển thị cơ quan đơn vị nếu đơn vị hiện tại là đơn vị trực thuộc */}
              {units[0].co_quan_don_vi && (
                <Form.Item label="Cơ quan đơn vị">
                  <Text type="secondary">
                    <strong>{units[0].co_quan_don_vi.ten_don_vi}</strong> ({units[0].co_quan_don_vi.ma_don_vi})
                  </Text>
                </Form.Item>
              )}
              <Form.Item label={units[0].co_quan_don_vi ? "Đơn vị trực thuộc" : "Đơn vị"}>
                <Text type="secondary">
                  <strong>{units[0].ten_don_vi}</strong> ({units[0].ma_don_vi})
                  {units[0].co_quan_don_vi && (
                    <span style={{ marginLeft: 8, color: '#999' }}>
                      • Trực thuộc: {units[0].co_quan_don_vi.ten_don_vi}
                    </span>
                  )}
                </Text>
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label={
                <span>
                  Đơn vị <span style={{ color: 'red' }}>*</span>
                </span>
              }
              name="don_vi_id"
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
            >
              <Select placeholder="Chọn đơn vị">
                {units.map((unit) => (
                  <Select.Option key={unit.id} value={unit.id.toString()}>
                    {unit.ten_don_vi}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </>
      )}

      <Form.Item
        label="Hệ số lương"
        name="he_so_luong"
      >
        <Input
          type="number"
          placeholder="Nhập hệ số lương"
          step="0.01"
        />
      </Form.Item>

      {/* Chỉ hiển thị checkbox "Là Chỉ huy?" khi tạo chức vụ cho cơ quan đơn vị (không có co_quan_don_vi_id) */}
      {/* Đơn vị trực thuộc không có checkbox này */}
      {(!position?.id && units.length === 1 && !units[0].co_quan_don_vi_id) || position?.id ? (
        <Form.Item
          name="is_manager"
          valuePropName="checked"
        >
          <Checkbox>Là Chỉ huy?</Checkbox>
        </Form.Item>
      ) : null}

      <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {position ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
