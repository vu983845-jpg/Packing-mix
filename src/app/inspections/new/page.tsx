'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { evaluateRule, formatStandardStr, MOCK_STANDARDS } from '@/lib/utils';
import { CellStatus, QualityStandard } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewInspection() {
    const router = useRouter();

    // Standard and Product logic
    const [standards, setStandards] = useState<QualityStandard[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [productId, setProductId] = useState<string>('');

    const [clusterCount, setClusterCount] = useState<number>(11);
    const [gridData, setGridData] = useState<Record<string, Record<number, string>>>({});

    // Form Info
    const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState<string>('Ca 1');
    const [containerNo, setContainerNo] = useState<string>('');
    const [ispNo, setIspNo] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    useEffect(() => {
        // Fetch standards from real DB
        const fetchData = async () => {
            const { data: pData } = await supabase.from('products').select('*').eq('active', true);
            if (pData) setProducts(pData);

            const { data, error } = await supabase
                .from('quality_standards')
                .select('*')
                .eq('active', true);

            if (!error && data && data.length > 0) {
                setStandards(data);
                setProductId(data[0].product_id); // Pick product id from first standard for simplicity
            } else {
                // fallback to MOCK if local dev not set up 
                setStandards(MOCK_STANDARDS);
                setProductId('009db42d-2099-4c12-861f-a3d5b0c9a752');
            }
        };
        fetchData();
    }, []);

    // Handlers
    const handleCellChange = (indicator: string, clusterIdx: number, value: string) => {
        if (value !== '' && isNaN(Number(value))) return;
        setGridData(prev => ({
            ...prev,
            [indicator]: { ...(prev[indicator] || {}), [clusterIdx]: value }
        }));
    };

    const getCellStatusClass = (status: CellStatus) => {
        if (status === 'fail') return 'cell-fail';
        if (status === 'warning') return 'cell-warning';
        if (status === 'pass') return 'cell-pass';
        return '';
    };

    const calculateAverage = (indicator: string) => {
        const row = gridData[indicator] || {};
        let sum = 0; let count = 0;
        for (let i = 1; i <= clusterCount; i++) {
            const valStr = row[i];
            if (valStr && valStr.trim() !== '') {
                sum += Number(valStr);
                count++;
            }
        }
        if (count === 0) return null;
        return Number((sum / count).toFixed(2));
    };

    const handleSubmit = async (submitStatus: 'draft' | 'submitted') => {
        try {
            setIsSaving(true);
            setErrorStatus(null);

            // Determine overall pass status
            let overallStatus = 'PASS';
            const summariesToInsert = [];
            const valuesToInsert = [];

            for (const std of standards) {
                const avg = calculateAverage(std.indicator_name);
                const st = evaluateRule(avg !== null ? avg : '', std);
                if (st === 'fail') overallStatus = 'FAIL';

                summariesToInsert.push({
                    indicator_name: std.indicator_name,
                    avg_value: avg,
                    pass_fail: st
                });

                // Also collect individual values
                for (let i = 1; i <= clusterCount; i++) {
                    const raw = gridData[std.indicator_name]?.[i];
                    if (raw && raw.trim() !== '') {
                        valuesToInsert.push({
                            indicator_name: std.indicator_name,
                            cluster_no: i,
                            value: Number(raw)
                        });

                        // secondary check if any individual cell fails
                        const cellStatus = evaluateRule(Number(raw), std);
                        if (cellStatus === 'fail' && overallStatus === 'PASS') {
                            overallStatus = 'CLUSTER_ABNORMAL';
                        }
                    }
                }
            }

            // 1. Insert into inspections
            const { data: inspectionData, error: insError } = await supabase
                .from('inspections')
                .insert({
                    inspection_date: inspectionDate,
                    shift: shift,
                    product_id: productId,
                    container_no: containerNo,
                    isp_no: ispNo,
                    inspector_name: 'Admin User', // Hardcoded for demo
                    remarks: remarks,
                    cluster_count: clusterCount,
                    status: submitStatus,
                    result: overallStatus,
                    created_by: 'c29db42d-2099-4c12-861f-a3d5b0c9a751' // Admin UUID from seed
                })
                .select()
                .single();

            if (insError) throw insError;

            const inspectionId = inspectionData.id;

            // 2. Insert values mapping to inspection_id
            if (valuesToInsert.length > 0) {
                const mappedValues = valuesToInsert.map(v => ({ ...v, inspection_id: inspectionId }));
                const { error: valError } = await supabase.from('inspection_values').insert(mappedValues);
                if (valError) throw valError;
            }

            // 3. Insert summaries
            if (summariesToInsert.length > 0) {
                const mappedSummaries = summariesToInsert.map(s => ({ ...s, inspection_id: inspectionId }));
                const { error: sumError } = await supabase.from('inspection_summary').insert(mappedSummaries);
                if (sumError) throw sumError;
            }

            // Success
            router.push('/');

        } catch (err: any) {
            console.error(err);
            setErrorStatus(err.message || 'Lỗi lưu dữ liệu. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="inspection-entry-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>New Inspection (MIX)</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Record sample results by cluster</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleSubmit('draft')}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Lưu nháp
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSubmit('submitted')}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Gửi hoàn tất
                    </button>
                </div>
            </div>

            {errorStatus && (
                <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    <strong>Lỗi:</strong> {errorStatus}
                </div>
            )}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>General Information</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-4">
                        <div className="form-group">
                            <label className="form-label">Ngày kiểm tra</label>
                            <input type="date" className="form-control" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ca</label>
                            <select className="form-control" value={shift} onChange={e => setShift(e.target.value)}>
                                <option>Ca 1</option>
                                <option>Ca 2</option>
                                <option>Ca 3</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mã hàng / Tên hàng</label>
                            <select className="form-control" value={productId} onChange={(e) => setProductId(e.target.value)}>
                                {products.length > 0 ? (
                                    products.map(p => (
                                        <option key={p.id} value={p.id}>{p.product_code} ({p.product_name})</option>
                                    ))
                                ) : (
                                    <option value="009db42d-2099-4c12-861f-a3d5b0c9a752">MIX-001 (Mix Hạt Dinh Dưỡng)</option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Người kiểm tra</label>
                            <input type="text" className="form-control" defaultValue="Admin User" readOnly />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cont No</label>
                            <input type="text" className="form-control" placeholder="Nhập số Cont..." value={containerNo} onChange={e => setContainerNo(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ISP No</label>
                            <input type="text" className="form-control" placeholder="Nhập ISP No..." value={ispNo} onChange={e => setIspNo(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Ghi chú</label>
                            <input type="text" className="form-control" placeholder="Ghi chú thêm..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Cluster Data Input</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Number of clusters:</label>
                        <select
                            className="form-control"
                            style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                            value={clusterCount}
                            onChange={(e) => setClusterCount(Number(e.target.value))}
                        >
                            {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {/* Legend */}
                    <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-light)', fontSize: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-success-light)', border: '1px solid #065f46' }}></div> Pass
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-warning-light)', border: '1px solid #92400e' }}></div> Close to limit
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-dark)' }}></div> Fail
                        </span>
                    </div>

                    <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="col-sticky" style={{ minWidth: '150px' }}>Indicator</th>
                                    <th style={{ minWidth: '120px' }}>Standard</th>
                                    {Array.from({ length: clusterCount }, (_, i) => i + 1).map(i => (
                                        <th key={i} style={{ minWidth: '80px', textAlign: 'center' }}>Cụm {i}</th>
                                    ))}
                                    <th style={{ minWidth: '100px', textAlign: 'center', background: '#e0f2fe', color: '#0369a1', zIndex: 3 }}>Tr.Bình<br />(Avg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standards.map((std) => {
                                    const avg = calculateAverage(std.indicator_name);
                                    const avgStatus = evaluateRule(avg !== null ? avg : '', std);

                                    return (
                                        <tr key={std.id}>
                                            <td className="col-sticky">{std.indicator_name}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                {formatStandardStr(std)}
                                            </td>

                                            {Array.from({ length: clusterCount }, (_, i) => i + 1).map(clusterIdx => {
                                                const cellValStr = gridData[std.indicator_name]?.[clusterIdx] || '';
                                                const parsedVal = cellValStr ? Number(cellValStr) : null;
                                                const cellStatus = cellValStr ? evaluateRule(parsedVal !== null ? parsedVal : '', std) : 'empty';

                                                return (
                                                    <td key={clusterIdx} className={`editable ${getCellStatusClass(cellStatus)}`}>
                                                        <input
                                                            type="text"
                                                            value={cellValStr}
                                                            onChange={(e) => handleCellChange(std.indicator_name, clusterIdx, e.target.value)}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                );
                                            })}

                                            <td
                                                className={`align-center ${getCellStatusClass(avgStatus)}`}
                                                style={{ fontWeight: 600, borderLeft: '2px solid #bae6fd' }}
                                            >
                                                {avg !== null ? avg : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
