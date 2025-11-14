// @ts-nocheck
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface PersonnelTableProps {
  personnel: any[];
  onEdit?: (p: any) => void;
  onRefresh?: () => void;
  readOnly?: boolean;
  viewLinkPrefix?: string; // '/admin/personnel' hoặc '/manager/personnel'
}

export function PersonnelTable({
  personnel,
  onEdit,
  onRefresh,
  readOnly = false,
  viewLinkPrefix = '/admin/personnel',
}: PersonnelTableProps) {

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] text-center">CCCD</TableHead>
              <TableHead className="w-[140px] text-center">Họ tên</TableHead>
              <TableHead className="w-[180px] text-center">Cơ quan đơn vị</TableHead>
              <TableHead className="w-[180px] text-center">Đơn vị trực thuộc</TableHead>
              <TableHead className="w-[160px] text-center">Chức vụ</TableHead>
              <TableHead className="w-[150px] text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personnel.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              personnel.map(p => {
                // Lấy tên cơ quan đơn vị
                const coQuanDonViName =
                  p.DonViTrucThuoc?.CoQuanDonVi?.ten_don_vi ||
                  p.CoQuanDonVi?.ten_don_vi ||
                  '-';

                // Lấy tên đơn vị trực thuộc
                const donViTrucThuocName = p.DonViTrucThuoc?.ten_don_vi || '-';

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-center">{p.cccd}</TableCell>
                    <TableCell className="text-center">{p.ho_ten}</TableCell>
                    <TableCell className="text-center">{coQuanDonViName}</TableCell>
                    <TableCell className="text-center">{donViTrucThuocName}</TableCell>
                    <TableCell className="text-center">
                      {p.ChucVu?.ten_chuc_vu || p.ten_chuc_vu || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {readOnly ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit?.(p)}
                            className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        ) : (
                          <Link href={`${viewLinkPrefix}/${p.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
