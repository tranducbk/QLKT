'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tag } from 'antd';
import { Loader2, Clock, User, Shield, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LogsTableProps {
  logs: any[];
  loading?: boolean;
}

const actionLabels: Record<string, string> = {
  // Accounts
  CREATE_ACCOUNT: 'Tạo tài khoản',
  UPDATE_ACCOUNT: 'Cập nhật tài khoản',
  DELETE_ACCOUNT: 'Xóa tài khoản',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  // Personnel
  CREATE_PERSONNEL: 'Tạo quân nhân',
  UPDATE_PERSONNEL: 'Cập nhật quân nhân',
  DELETE_PERSONNEL: 'Xóa quân nhân',
  // Units
  CREATE_UNIT: 'Tạo cơ quan đơn vị/đơn vị trực thuộc',
  UPDATE_UNIT: 'Cập nhật cơ quan đơn vị/đơn vị trực thuộc',
  DELETE_UNIT: 'Xóa cơ quan đơn vị/đơn vị trực thuộc',
  // Positions
  CREATE_POSITIONS: 'Tạo chức vụ',
  UPDATE_POSITIONS: 'Cập nhật chức vụ',
  DELETE_POSITIONS: 'Xóa chức vụ',
  // Proposals
  CREATE_PROPOSALS: 'Tạo đề xuất',
  UPDATE_PROPOSALS: 'Cập nhật đề xuất',
  DELETE_PROPOSALS: 'Xóa đề xuất',
  APPROVE_PROPOSALS: 'Phê duyệt đề xuất',
  REJECT_PROPOSALS: 'Từ chối đề xuất',
  // Annual Rewards
  CREATE_ANNUAL_REWARDS: 'Tạo danh hiệu hằng năm',
  UPDATE_ANNUAL_REWARDS: 'Cập nhật danh hiệu hằng năm',
  DELETE_ANNUAL_REWARDS: 'Xóa danh hiệu hằng năm',
  BULK_ANNUAL_REWARDS: 'Thêm đồng loạt danh hiệu hằng năm',
  IMPORT_ANNUAL_REWARDS: 'Import danh hiệu hằng năm',
  // Position History
  CREATE_POSITION_HISTORY: 'Tạo lịch sử chức vụ',
  UPDATE_POSITION_HISTORY: 'Cập nhật lịch sử chức vụ',
  DELETE_POSITION_HISTORY: 'Xóa lịch sử chức vụ',
  // Scientific Achievements
  CREATE_SCIENTIFIC_ACHIEVEMENTS: 'Tạo thành tích khoa học',
  UPDATE_SCIENTIFIC_ACHIEVEMENTS: 'Cập nhật thành tích khoa học',
  DELETE_SCIENTIFIC_ACHIEVEMENTS: 'Xóa thành tích khoa học',
  // Decisions
  CREATE_DECISIONS: 'Tạo quyết định',
  UPDATE_DECISIONS: 'Cập nhật quyết định',
  DELETE_DECISIONS: 'Xóa quyết định',
  // Auth
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  CHANGE_PASSWORD: 'Đổi mật khẩu',
  // Personnel
  IMPORT_PERSONNEL: 'Import quân nhân',
  EXPORT_PERSONNEL: 'Xuất dữ liệu quân nhân',
};

const actionColors: Record<string, string> = {
  CREATE:
    'bg-green-100/50 text-green-900 dark:bg-green-900/60 dark:text-green-50 border-green-300 dark:border-green-600',
  UPDATE:
    'bg-blue-100/50 text-blue-900 dark:bg-blue-900/60 dark:text-blue-50 border-blue-300 dark:border-blue-600',
  DELETE:
    'bg-red-100/50 text-red-900 dark:bg-red-900/60 dark:text-red-50 border-red-300 dark:border-red-600',
  RESET:
    'bg-yellow-100/50 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-50 border-yellow-300 dark:border-yellow-600',
  APPROVE:
    'bg-emerald-100/50 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-50 border-emerald-300 dark:border-emerald-600',
  REJECT:
    'bg-orange-100/50 text-orange-900 dark:bg-orange-900/60 dark:text-orange-50 border-orange-300 dark:border-orange-600',
};

function getActionColor(action: string): string {
  if (action.includes('CREATE')) return actionColors.CREATE;
  if (action.includes('UPDATE')) return actionColors.UPDATE;
  if (action.includes('DELETE')) return actionColors.DELETE;
  if (action.includes('RESET')) return actionColors.RESET;
  if (action.includes('APPROVE')) return actionColors.APPROVE;
  if (action.includes('REJECT')) return actionColors.REJECT;
  return 'bg-gray-100/50 text-gray-900 dark:bg-gray-800/60 dark:text-gray-50 border-gray-300 dark:border-gray-600';
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN:
    'bg-red-100/50 text-red-900 dark:bg-red-900/60 dark:text-red-50 border-red-300 dark:border-red-600',
  ADMIN:
    'bg-orange-100/50 text-orange-900 dark:bg-orange-900/60 dark:text-orange-50 border-orange-300 dark:border-orange-600',
  MANAGER:
    'bg-blue-100/50 text-blue-900 dark:bg-blue-900/60 dark:text-blue-50 border-blue-300 dark:border-blue-600',
  USER: 'bg-green-100/50 text-green-900 dark:bg-green-900/60 dark:text-green-50 border-green-300 dark:border-green-600',
};

function getRoleTagColor(role: string): string {
  const colorMap: Record<string, string> = {
    SUPER_ADMIN: 'red',
    ADMIN: 'orange',
    MANAGER: 'blue',
    USER: 'green',
  };
  return colorMap[role] || 'default';
}

function getRoleText(role: string): string {
  const textMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MANAGER: 'Quản lý',
    USER: 'Người dùng',
  };
  return textMap[role] || role;
}

export function LogsTable({ logs, loading }: LogsTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Đang tải nhật ký...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Không có nhật ký nào</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
          Hệ thống chưa ghi nhận hoạt động nào
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 border-0">
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Thời gian
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Người dùng
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vai trò
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Hành động
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Chi tiết
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow
              key={log.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-gray-200 dark:border-gray-700"
            >
              <TableCell className="text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
              </TableCell>
              <TableCell className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {log.actor_name || log.actor_id}
              </TableCell>
              <TableCell>
                <Tag color={getRoleTagColor(log.actor_role)}>{getRoleText(log.actor_role)}</Tag>
              </TableCell>
              <TableCell className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {actionLabels[log.action] ||
                  actionLabels[log.action?.replace(/-/g, '_')] ||
                  log.action}
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                <div className="truncate" title={log.details || log.description || ''}>
                  {log.details || log.description || '-'}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
