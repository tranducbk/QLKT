'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, User, Shield, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LogsTableProps {
  logs: any[];
  loading?: boolean;
}

const actionLabels: Record<string, string> = {
  CREATE_ACCOUNT: 'Tạo tài khoản',
  UPDATE_ACCOUNT: 'Cập nhật tài khoản',
  DELETE_ACCOUNT: 'Xóa tài khoản',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  CREATE_PERSONNEL: 'Tạo quân nhân',
  UPDATE_PERSONNEL: 'Cập nhật quân nhân',
  DELETE_PERSONNEL: 'Xóa quân nhân',
  CREATE_UNIT: 'Tạo đơn vị',
  UPDATE_UNIT: 'Cập nhật đơn vị',
  DELETE_UNIT: 'Xóa đơn vị',
  CREATE_POSITIONS: 'Tạo chức vụ',
  UPDATE_POSITIONS: 'Cập nhật chức vụ',
  DELETE_POSITIONS: 'Xóa chức vụ',
};

const actionColors: Record<string, string> = {
  CREATE:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  UPDATE:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  DELETE:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  RESET:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
};

function getActionColor(action: string): string {
  if (action.includes('CREATE')) return actionColors.CREATE;
  if (action.includes('UPDATE')) return actionColors.UPDATE;
  if (action.includes('DELETE')) return actionColors.DELETE;
  if (action.includes('RESET')) return actionColors.RESET;
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  ADMIN:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  MANAGER:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  USER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
};

function getRoleColor(role: string): string {
  return (
    roleColors[role] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  );
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
                <Badge variant="outline" className={getRoleColor(log.actor_role)}>
                  {log.actor_role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getActionColor(log.action)}>
                  {actionLabels[log.action] || log.action}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                <div className="truncate" title={log.details}>
                  {log.details}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
