"use client"

import { useState } from "react"
import { Table, Button, Space, Popconfirm, message, Tag } from "antd"
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface UnitsTableProps {
  units: any[]
  onEdit?: (unit: any) => void
  onRefresh?: () => void
}

export function UnitsTable({ units, onEdit, onRefresh }: UnitsTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      setDeletingId(id)
      await apiClient.deleteUnit(id)
      message.success("Xóa đơn vị thành công")
      onRefresh?.()
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa")
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
  }

  const columns: ColumnsType<any> = [
    {
      title: 'Mã Đơn vị',
      dataIndex: 'ma_don_vi',
      key: 'ma_don_vi',
      width: 120,
      align: 'center',
      render: (text) => text,
    },
    {
      title: 'Tên Đơn vị',
      dataIndex: 'ten_don_vi',
      key: 'ten_don_vi',
      width: 250,
      align: 'left',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Quân số',
      dataIndex: 'so_luong',
      key: 'so_luong',
      width: 100,
      align: 'center',
      render: (val) => val ?? 0,
    },
    {
      title: 'Đơn vị trực thuộc',
      dataIndex: 'DonViTrucThuoc',
      key: 'children',
      width: 150,
      align: 'center',
      render: (children) => children?.length ?? 0,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 280,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/categories/units/${record.id}`)}
          >
            Chi tiết
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa đơn vị này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
          >
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={units}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng số ${total} đơn vị`,
      }}
      locale={{
        emptyText: 'Không có dữ liệu',
      }}
    />
  )
}
