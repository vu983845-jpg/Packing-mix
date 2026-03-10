'use client';

import Link from 'next/link';
import { ArrowLeft, Printer, CheckCircle2, AlertTriangle, FileDown } from 'lucide-react';
import { MOCK_STANDARDS, evaluateRule, formatStandardStr } from '@/lib/utils';
import { CellStatus } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DetailPage() {
    // Mock data for viewing a completed inspection
    const mockInspection = {
        id: 'ISP-2401',
        date: '2024-05-20',
        shift: 'Shift 1',
        product: 'MIX-001',
        container: 'CONT-8890',
        inspector: 'Nguyen Van A',
        status: 'PASS',
        clusterCount: 11,
        remarks: 'Sample batch looks good',
        data: {
            'Hạt': { avg: 310, status: 'pass' as CellStatus },
            'Bể': { avg: 15, status: 'pass' as CellStatus },
            'LP ss': { avg: 1.2, status: 'pass' as CellStatus },
            'A': { avg: 0.8, status: 'pass' as CellStatus },
            'B': { avg: 2, status: 'pass' as CellStatus },
            'C': { avg: 5, status: 'pass' as CellStatus },
            'Vết dao': { avg: 4, status: 'pass' as CellStatus },
            'Lụa': { avg: 3, status: 'pass' as CellStatus },
            'Total defect': { avg: 12.4, status: 'pass' as CellStatus }
        }
    };

    const getCellStatusClass = (status: CellStatus) => {
        if (status === 'fail') return 'cell-fail';
        if (status === 'warning') return 'cell-warning';
        if (status === 'pass') return 'cell-pass';
        return '';
    };

    const chartData = MOCK_STANDARDS.map(std => {
        // safely handle if data doesn't exist
        const actualNode = mockInspection.data[std.indicator_name as keyof typeof mockInspection.data];
        return {
            name: std.indicator_name,
            actual: actualNode ? actualNode.avg : 0,
            standard: std.rule_type === 'range' ? std.min_value : std.max_value
        };
    });

    return (
        <div className="inspection-detail-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inspection Detail: {mockInspection.id}</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>View and print recorded results</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary"><FileDown size={18} /> Export Excel</button>
                    <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Print Report</button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>Summary & Status</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-4">
                        <div className="form-group">
                            <span className="form-label" style={{ color: 'var(--text-secondary)' }}>Overall Result</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                <CheckCircle2 size={24} /> {mockInspection.status}
                            </div>
                        </div>
                        <div className="form-group">
                            <span className="form-label" style={{ color: 'var(--text-secondary)' }}>Date & Shift</span>
                            <div style={{ fontWeight: 500 }}>{mockInspection.date} - {mockInspection.shift}</div>
                        </div>
                        <div className="form-group">
                            <span className="form-label" style={{ color: 'var(--text-secondary)' }}>Product</span>
                            <div style={{ fontWeight: 500 }}>{mockInspection.product}</div>
                        </div>
                        <div className="form-group">
                            <span className="form-label" style={{ color: 'var(--text-secondary)' }}>Container / ISP</span>
                            <div style={{ fontWeight: 500 }}>{mockInspection.container} / {mockInspection.id}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3>Average Results Table</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Indicator</th>
                                        <th style={{ width: '30%' }}>Standard</th>
                                        <th style={{ width: '40%', textAlign: 'center' }}>Total Average</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_STANDARDS.map((std) => {
                                        // type assertion to satisfy TS since data keys are statically inferred strings but might have typos in generic usage
                                        const recordNode = mockInspection.data[std.indicator_name as keyof typeof mockInspection.data];
                                        const avg = recordNode ? recordNode.avg : '-';
                                        const status = recordNode ? recordNode.status : 'empty';

                                        return (
                                            <tr key={std.indicator_name}>
                                                <td style={{ fontWeight: 500 }}>{std.indicator_name}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatStandardStr(std)}</td>
                                                <td className={`align-center ${getCellStatusClass(status)}`} style={{ fontWeight: 600 }}>
                                                    {avg}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Visual Comparison</h3>
                    </div>
                    <div className="card-body chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} style={{ fontSize: '0.75rem' }} />
                                <RechartsTooltip />
                                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="standard" name="Limit/Target" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
