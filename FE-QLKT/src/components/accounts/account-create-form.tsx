// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { accountCreateSchema } from '@/lib/schemas';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type AccountCreateValues = z.infer<typeof accountCreateSchema>;

export function AccountCreateForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Lấy role của user hiện tại từ localStorage
    const role = localStorage.getItem('role');
    setCurrentUserRole(role || '');

    // Lấy danh sách đơn vị và chức vụ
    fetchUnitsAndPositions();
  }, []);

  const fetchUnitsAndPositions = async () => {
    try {
      const [unitsRes, positionsRes] = await Promise.all([
        apiClient.getUnits(), // Lấy tất cả đơn vị (cả cơ quan đơn vị và đơn vị trực thuộc)
        apiClient.getPositions(),
      ]);

      if (unitsRes.success) {
        // Backend trả về mảng phẳng gồm cả cơ quan đơn vị và đơn vị trực thuộc
        const unitsData = unitsRes.data || [];
        
        // Chuẩn hóa dữ liệu đơn vị
        const normalizedUnits = unitsData.map((unit: any) => {
          // Nếu có co_quan_don_vi_id thì là đơn vị trực thuộc
          if (unit.co_quan_don_vi_id || unit.CoQuanDonVi) {
            return {
              id: unit.id,
              ten_don_vi: unit.ten_don_vi,
              ma_don_vi: unit.ma_don_vi,
              type: 'don_vi_truc_thuoc',
              CoQuanDonVi: unit.CoQuanDonVi || null,
            };
          } else {
            // Không có co_quan_don_vi_id thì là cơ quan đơn vị
            return {
              id: unit.id,
              ten_don_vi: unit.ten_don_vi,
              ma_don_vi: unit.ma_don_vi,
              type: 'co_quan_don_vi',
              CoQuanDonVi: null,
            };
          }
        });
        
        setUnits(normalizedUnits);
      }

      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching units and positions:', error);
    }
  };

  const form = useForm<AccountCreateValues>({
    resolver: zodResolver(accountCreateSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
    },
  });

  // Watch role và don_vi_id để filter chức vụ
  const selectedRole = form.watch('role');
  const selectedDonViId = form.watch('don_vi_id');

  // Lọc chức vụ theo đơn vị được chọn
  const filteredPositions = selectedDonViId
    ? positions.filter((p) => {
        // Chức vụ có thể thuộc cơ quan đơn vị hoặc đơn vị trực thuộc
        return (
          p.co_quan_don_vi_id === selectedDonViId ||
          p.don_vi_truc_thuoc_id === selectedDonViId
        );
      })
    : [];

  // Reset chức vụ khi đổi đơn vị
  useEffect(() => {
    if (selectedDonViId !== undefined) {
      form.setValue('chuc_vu_id', undefined);
    }
  }, [selectedDonViId, form]);

  // Lấy danh sách role có thể tạo dựa trên role hiện tại
  const getAvailableRoles = () => {
    if (currentUserRole === 'SUPER_ADMIN') {
      return [
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'MANAGER', label: 'Quản lý' },
        { value: 'USER', label: 'Người dùng' },
      ];
    } else if (currentUserRole === 'ADMIN') {
      // ADMIN chỉ được tạo MANAGER và USER
      return [
        { value: 'MANAGER', label: 'Quản lý' },
        { value: 'USER', label: 'Người dùng' },
      ];
    }
    // Mặc định chỉ có USER
    return [{ value: 'USER', label: 'Người dùng' }];
  };

  async function onSubmit(values: AccountCreateValues) {
    try {
      setLoading(true);

      // Loại bỏ confirmPassword trước khi gửi lên server
      const { confirmPassword, ...submitData } = values;

      const response = await apiClient.createAccount(submitData);

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Tạo tài khoản thành công',
        });
        router.push('/admin/accounts');
      } else {
        // Hiển thị lỗi từ backend
        console.error('Create account error:', response);
        toast({
          title: 'Lỗi',
          description: response.message || 'Có lỗi xảy ra khi tạo tài khoản',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // Hiển thị lỗi nếu có exception
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Có lỗi xảy ra khi tạo tài khoản';

      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin tài khoản</h3>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vai trò *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đăng nhập *</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập tên đăng nhập" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      {...field}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      {...field}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Unit and Position - For MANAGER and USER */}
        {(selectedRole === 'MANAGER' || selectedRole === 'USER') && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Thông tin đơn vị và chức vụ</h3>

            <FormField
              control={form.control}
              name="don_vi_id"
              render={({ field }) => {
                // Lọc đơn vị theo role
                const availableUnits = selectedRole === 'MANAGER'
                  ? units.filter((u) => u.type === 'co_quan_don_vi') // MANAGER chỉ chọn cơ quan đơn vị
                  : units; // USER có thể chọn cả cơ quan đơn vị và đơn vị trực thuộc

                return (
                  <FormItem>
                    <FormLabel>{selectedRole === 'MANAGER' ? 'Cơ quan đơn vị' : 'Đơn vị'} *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedRole === 'MANAGER' ? 'Chọn cơ quan đơn vị' : 'Chọn đơn vị'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.type === 'don_vi_truc_thuoc' && unit.CoQuanDonVi
                              ? `${unit.ten_don_vi} (${unit.CoQuanDonVi.ten_don_vi})`
                              : unit.ten_don_vi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="chuc_vu_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chức vụ *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                    disabled={loading || !selectedDonViId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedDonViId
                              ? "Chọn chức vụ"
                              : "Vui lòng chọn đơn vị trước"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredPositions.length > 0 ? (
                        filteredPositions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.ten_chuc_vu}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>
                          Không có chức vụ nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="default" onClick={() => router.back()} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
