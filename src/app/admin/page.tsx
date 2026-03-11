'use client';

import { useState, useEffect } from 'react';
import { Settings2, Save, Users, Layers, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatStandardStr } from '@/lib/utils';
import { QualityStandard, RuleType } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('standards');
    
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [standards, setStandards] = useState<QualityStandard[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase.from('products').select('*').eq('active', true);
            if (data && data.length > 0) {
                setProducts(data);
                setSelectedProductId(data[0].id);
            }
        };
        fetchProducts();
    }, []);

    // Fetch Standards when product changes
    useEffect(() => {
        if (!selectedProductId) return;

        const fetchStandards = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('quality_standards')
                .select('*')
                .eq('product_id', selectedProductId)
                .order('indicator_name');
            
            if (data) {
                setStandards(data);
            }
            setIsLoading(false);
        };

        fetchStandards();
    }, [selectedProductId]);

    const handleUpdateStandard = (id: string, field: keyof QualityStandard, value: any) => {
        setStandards(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const handleAddStandard = () => {
        if (!selectedProductId) return;
        
        const newStandard: QualityStandard = {
            id: `temp-${Date.now()}`,
            product_id: selectedProductId,
            indicator_name: 'Chỉ tiêu mới',
            rule_type: 'max',
            min_value: null,
            max_value: 0,
            target_value: null,
        };
        setStandards([...standards, newStandard]);
    };

    const handleRemoveStandard = (id: string) => {
        setStandards(standards.filter(s => s.id !== id));
    };

    const handleSaveStandards = async () => {
        if (!selectedProductId) return;
        setIsSaving(true);
        try {
            // Because users can delete, easiest is to delete all for this product and re-insert 
            // OR use upsert. Since we don't have constraints preventing deletion, let's just 
            // delete all and insert the current list to handle removals easily.
            // Wait, deleting all might break inspection_summary dependencies if there are FKs?
            // "quality_standards" is not linked by FK from inspection_values/summary (they use strings).
            // So fully replacing is safe.
            
            // Delete existing
            await supabase.from('quality_standards').delete().eq('product_id', selectedProductId);
            
            // Insert new 
            const toInsert = standards.map(s => {
                const { id, ...rest } = s; 
                // remove temp- ids so db generates new UUIDs if it's a new one. 
                // But actually we can just pass id if it's valid UUID, omit if temp.
                if (id.startsWith('temp-')) {
                    return rest;
                }
                return { id, ...rest };
            });

            if (toInsert.length > 0) {
                const { error } = await supabase.from('quality_standards').insert(toInsert);
                if (error) throw error;
            }

            alert('Đã lưu cấu hình chỉ tiêu thành công!');
            
            // Refetch to get real UUIDs for new items
            const { data } = await supabase.from('quality_standards').select('*').eq('product_id', selectedProductId).order('indicator_name');
            if (data) setStandards(data);
            
        } catch (error: any) {
            console.error(error);
            alert('Lỗi lưu: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedProductCode = products.find(p => p.id === selectedProductId)?.product_code || '---';

    return (
        <div className="admin-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Cài đặt hệ thống (Admin)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Quản lý định mức chất lượng, phân quyền và hệ thống</p>
            </div>

            <div className="card">
                <div className="card-header" style={{ padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                        <button
                            className={`btn ${activeTab === 'standards' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'standards' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('standards')}
                        >
                            <Settings2 size={18} /> Tiêu chuẩn chất lượng
                        </button>
                        <button
                            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={18} /> Phân quyền
                        </button>
                        <button
                            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'settings' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Layers size={18} /> Cài đặt chung
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {activeTab === 'standards' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Cấu hình cho mã:</h3>
                                    <select 
                                        className="form-control" 
                                        style={{ width: '200px', fontWeight: 'bold', color: 'var(--color-primary)' }}
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="btn btn-primary" onClick={handleSaveStandards} disabled={isSaving || isLoading}>
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu Thay Đổi
                                </button>
                            </div>

                            {isLoading ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                                    Đang tải cấu hình...
                                </div>
                            ) : (
                                <>
                                    <div className="data-table-wrapper" style={{ border: '1px solid var(--border-light)', overflowX: 'auto' }}>
                                        <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '25%' }}>Tên Chỉ Tiêu</th>
                                                    <th style={{ width: '20%' }}>Loại Toán Tử (Rule)</th>
                                                    <th style={{ width: '15%' }}>Giá trị Min</th>
                                                    <th style={{ width: '15%' }}>Giá trị Max</th>
                                                    <th style={{ width: '15%' }}>Hiển thị Logic</th>
                                                    <th style={{ width: '10%', textAlign: 'center' }}>Xóa</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {standards.map((std) => (
                                                    <tr key={std.id}>
                                                        <td className="editable">
                                                            <input
                                                                type="text"
                                                                style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}
                                                                value={std.indicator_name}
                                                                onChange={(e) => handleUpdateStandard(std.id, 'indicator_name', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="editable">
                                                            <select
                                                                className="form-control"
                                                                style={{ border: 'none', background: 'transparent' }}
                                                                value={std.rule_type}
                                                                onChange={(e) => handleUpdateStandard(std.id, 'rule_type', e.target.value as RuleType)}
                                                            >
                                                                <option value="range">Range (Min - Max)</option>
                                                                <option value="max">Maximum (&lt;= Max)</option>
                                                                <option value="min">Minimum (&gt;= Min)</option>
                                                            </select>
                                                        </td>
                                                        <td className="editable">
                                                            <input
                                                                type="number"
                                                                style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}
                                                                value={std.min_value !== null ? std.min_value : ''}
                                                                disabled={std.rule_type === 'max'}
                                                                onChange={(e) => handleUpdateStandard(std.id, 'min_value', e.target.value ? Number(e.target.value) : null)}
                                                                placeholder={std.rule_type === 'max' ? '-' : '0'}
                                                            />
                                                        </td>
                                                        <td className="editable">
                                                            <input
                                                                type="number"
                                                                style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}
                                                                value={std.max_value !== null ? std.max_value : ''}
                                                                disabled={std.rule_type === 'min'}
                                                                onChange={(e) => handleUpdateStandard(std.id, 'max_value', e.target.value ? Number(e.target.value) : null)}
                                                                placeholder={std.rule_type === 'min' ? '-' : '0'}
                                                            />
                                                        </td>
                                                        <td>
                                                            <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                                {formatStandardStr(std)}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button className="icon-btn" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemoveStandard(std.id)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {standards.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                                            Sản phẩm này chưa có cấu hình tiêu chuẩn nào.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button onClick={handleAddStandard} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                                        <Plus size={18} /> Thêm Chỉ Tiêu (Add Indicator)
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>User Management</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Quản lý quyền truy cập. <i>(Tính năng đang phát triển)</i></p>

                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Packing Team</td>
                                        <td>packing@dds.com</td>
                                        <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>User</span></td>
                                        <td>Active</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Cài đặt chung</h3>

                            <div className="form-group">
                                <label className="form-label">Mặc định số cụm (Clusters) cho phiếu kiểm mới</label>
                                <select className="form-control">
                                    <option value="11">11 Cụm</option>
                                    <option value="10">10 Cụm</option>
                                    <option value="5">5 Cụm</option>
                                </select>
                            </div>

                            <button className="btn btn-primary" style={{ marginTop: '1rem' }} disabled>Đang phát triển</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
