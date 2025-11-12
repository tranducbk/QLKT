'use client';

import { useState, useEffect } from 'react';
import { Card, Input, DatePicker, Select, Button, Typography } from 'antd';
import { SearchOutlined, ClearOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import type { SelectProps } from 'antd';

dayjs.locale('vi');

const { Text } = Typography;

interface LogsFilterProps {
  onFilterChange: (filters: any) => void;
}

export function LogsFilter({ onFilterChange }: LogsFilterProps) {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [actorRole, setActorRole] = useState<string | undefined>();
  const [actions, setActions] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [action, setAction] = useState<string | undefined>();
  const [resource, setResource] = useState<string | undefined>();

  // Initialize with common actions and resources
  useEffect(() => {
    // Common actions
    setActions(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RESET_PASSWORD']);
    // Common resources
    setResources(['accounts', 'personnel', 'positions', 'units']);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => {
      onFilterChange({
        search: value,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        actorRole,
        action,
        resource,
      });
    }, 300);
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    onFilterChange({
      search,
      startDate: date?.toISOString(),
      endDate: endDate?.toISOString(),
      actorRole,
      action,
      resource,
    });
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    onFilterChange({
      search,
      startDate: startDate?.toISOString(),
      endDate: date?.toISOString(),
      actorRole,
      action,
      resource,
    });
  };

  const handleRoleChange = (value: string) => {
    const role = value === 'ALL' ? undefined : value;
    setActorRole(role);
    onFilterChange({
      search,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      actorRole: role,
      action,
      resource,
    });
  };

  const handleActionChange = (value: string) => {
    const a = value === 'ALL' ? undefined : value;
    setAction(a);
    onFilterChange({
      search,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      actorRole,
      action: a,
      resource,
    });
  };

  const handleResourceChange = (value: string) => {
    const r = value === 'ALL' ? undefined : value;
    setResource(r);
    onFilterChange({
      search,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      actorRole,
      action,
      resource: r,
    });
  };

  const handleReset = () => {
    setSearch('');
    setStartDate(null);
    setEndDate(null);
    setActorRole(undefined);
    setAction(undefined);
    setResource(undefined);
    onFilterChange({
      search: '',
      startDate: undefined,
      endDate: undefined,
      actorRole: undefined,
      action: undefined,
      resource: undefined,
    });
  };

  const hasActiveFilters = search || startDate || endDate || actorRole || action || resource;

  const disabledStartDate = (current: Dayjs) => {
    if (!endDate) return false;
    return current && current > endDate;
  };

  const disabledEndDate = (current: Dayjs) => {
    if (!startDate) return false;
    return current && current < startDate;
  };

  const roleOptions: SelectProps['options'] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'SUPER_ADMIN', value: 'SUPER_ADMIN' },
    { label: 'ADMIN', value: 'ADMIN' },
    { label: 'MANAGER', value: 'MANAGER' },
    { label: 'USER', value: 'USER' },
  ];

  const actionOptions: SelectProps['options'] = [
    { label: 'Tất cả', value: 'ALL' },
    ...actions.map(a => ({ label: a, value: a })),
  ];

  const resourceOptions: SelectProps['options'] = [
    { label: 'Tất cả', value: 'ALL' },
    ...resources.map(r => ({ label: r, value: r })),
  ];

  return (
    <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Tìm kiếm
          </Text>
          <Input
            placeholder="Tìm kiếm theo hành động hoặc người dùng..."
            prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            size="large"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Start Date */}
        <div>
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Từ ngày
          </Text>
          <DatePicker
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value={startDate}
            onChange={handleStartDateChange}
            disabledDate={disabledStartDate}
            suffixIcon={<CalendarOutlined />}
            size="large"
            style={{ width: '100%' }}
            className="bg-white dark:bg-gray-700"
          />
        </div>

        {/* End Date */}
        <div>
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Đến ngày
          </Text>
          <DatePicker
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value={endDate}
            onChange={handleEndDateChange}
            disabledDate={disabledEndDate}
            suffixIcon={<CalendarOutlined />}
            size="large"
            style={{ width: '100%' }}
            className="bg-white dark:bg-gray-700"
          />
        </div>

        {/* Actor Role */}
        <div>
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Vai trò
          </Text>
          <Select
            placeholder="Chọn vai trò"
            value={actorRole || 'ALL'}
            onChange={handleRoleChange}
            options={roleOptions}
            size="large"
            style={{ width: '100%' }}
            className="bg-white dark:bg-gray-700"
          />
        </div>

        {/* Action */}
        <div>
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Hành động
          </Text>
          <Select
            placeholder="Tất cả"
            value={action || 'ALL'}
            onChange={handleActionChange}
            options={actionOptions}
            size="large"
            style={{ width: '100%' }}
            className="bg-white dark:bg-gray-700"
          />
        </div>

        {/* Resource */}
        <div>
          <Text className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
            Tài nguyên
          </Text>
          <Select
            placeholder="Tất cả"
            value={resource || 'ALL'}
            onChange={handleResourceChange}
            options={resourceOptions}
            size="large"
            style={{ width: '100%' }}
            className="bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={handleReset}
            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </Card>
  );
}
