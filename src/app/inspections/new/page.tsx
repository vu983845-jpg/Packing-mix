'use client';

import { useState, useMemo, useEffect } from 'react';
import { Save, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MOCK_STANDARDS, evaluateRule, formatStandardStr } from '@/lib/utils';
import { CellStatus } from '@/lib/types';

export default function NewInspection() {
    const [clusterCount, setClusterCount] = useState<number>(11);
    const [gridData, setGridData] = useState<Record<string, Record<number, string>>>({});

    // Initialize grid standard rows
    const indicators = MOCK_STANDARDS.map(s => s.indicator_name);

    // Handlers
    const handleCellChange = (indicator: string, clusterIdx: number, value: string) => {
        // Basic number validation
        if (value !== '' && isNaN(Number(value))) return;

        setGridData(prev => ({
            ...prev,
            [indicator]: {
                ...(prev[indicator] || {}),
                [clusterIdx]: value
            }
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
        let sum = 0;
        let count = 0;

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
                    <button className="btn btn-secondary"><Save size={18} /> Lưu nháp</button>
                    <button className="btn btn-primary"><CheckCircle size={18} /> Gửi hoàn tất</button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>General Information</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-4">
                        <div className="form-group">
                            <label className="form-label">Ngày kiểm tra</label>
                            <input type="date" className="form-control" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ca</label>
                            <select className="form-control">
                                <option>Ca 1</option>
                                <option>Ca 2</option>
                                <option>Ca 3</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mã hàng / Tên hàng</label>
                            <select className="form-control">
                                <option>MIX-001 (Mix Hạt Dinh Dưỡng)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Người kiểm tra</label>
                            <input type="text" className="form-control" defaultValue="Admin User" readOnly />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cont No</label>
                            <input type="text" className="form-control" placeholder="Nhập số Cont..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ISP No</label>
                            <input type="text" className="form-control" placeholder="Nhập ISP No..." />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Ghi chú</label>
                            <input type="text" className="form-control" placeholder="Ghi chú thêm..." />
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
                                {MOCK_STANDARDS.map((std) => {
                                    const avg = calculateAverage(std.indicator_name);
                                    const avgStatus = evaluateRule(avg, std);

                                    return (
                                        <tr key={std.indicator_name}>
                                            <td className="col-sticky">{std.indicator_name}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                {formatStandardStr(std)}
                                            </td>

                                            {Array.from({ length: clusterCount }, (_, i) => i + 1).map(clusterIdx => {
                                                const cellValStr = gridData[std.indicator_name]?.[clusterIdx] || '';
                                                const parsedVal = cellValStr ? Number(cellValStr) : null;
                                                const cellStatus = cellValStr ? evaluateRule(parsedVal, std) : 'empty';

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
