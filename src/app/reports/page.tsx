'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FileText, Loader2, Trash2, Edit } from 'lucide-react';

export default function ReportsPage() {
    const [inspections, setInspections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInspections = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('inspections')
                .select(`id, inspection_date, shift, container_no, isp_no, inspector_name, result, status, cluster_count, products(product_code)`)
                .order('created_at', { ascending: false })
                .limit(50); // Just fetch the last 50 for the report view

            if (data) {
                setInspections(data);
            }
        } catch (error) {
            console.error("Error fetching for reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInspections();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if this was inside a link
        if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này cùng toàn bộ dữ liệu cụm (clusters) của nó?')) return;

        try {
            const { error: summaryError } = await supabase.from('inspection_summary').delete().eq('inspection_id', id);
            if (summaryError) throw summaryError;

            const { error: valuesError } = await supabase.from('inspection_values').delete().eq('inspection_id', id);
            if (valuesError) throw valuesError;

            const { error: mainError } = await supabase.from('inspections').delete().eq('id', id);
            if (mainError) throw mainError;

            // Refresh list
            setInspections(prev => prev.filter(i => i.id !== id));
            alert('Đã xóa thành công!');
        } catch (error: any) {
            console.error('Lỗi khi xóa:', error);
            alert('Lỗi xóa dữ liệu: ' + error.message);
        }
    };

    return (
        <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quản lý Báo cáo & Lịch sử</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Xem và quản lý tất cả phiếu kiểm tra</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Lịch sử kiểm tra gần đây (Tối đa 50 phiếu)</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                            Đang tải dữ liệu...
                        </div>
                    ) : inspections.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Chưa có dữ liệu báo cáo nào.
                        </div>
                    ) : (
                        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="col-sticky">Mã Lô (ISP)</th>
                                        <th>Ngày / Ca</th>
                                        <th>Container</th>
                                        <th>Mã Hàng (Product)</th>
                                        <th>Số Cụm (Clusters)</th>
                                        <th>Người kiểm tra</th>
                                        <th>Kết Quả</th>
                                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspections.map((item) => (
                                        <tr key={item.id}>
                                            <td className="col-sticky" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                                {item.isp_no}
                                            </td>
                                            <td>{new Date(item.inspection_date).toLocaleDateString()} / {item.shift}</td>
                                            <td>{item.container_no || '-'}</td>
                                            <td>{item.products?.product_code || '-'}</td>
                                            <td className="align-center">{item.cluster_count || 0}</td>
                                            <td>{item.inspector_name}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: item.result === 'PASS' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                                                    color: item.result === 'PASS' ? '#065f46' : 'var(--color-danger-dark)',
                                                }}>
                                                    {item.result === 'PASS' ? 'ĐẠT' : (item.result === 'FAIL' ? 'RỚT' : 'CHỜ')}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <Link href={`/inspections/${item.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                        <Edit size={14} /> Sửa
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDelete(item.id, e)}
                                                        className="btn"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', border: 'none' }}
                                                    >
                                                        <Trash2 size={14} /> Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
