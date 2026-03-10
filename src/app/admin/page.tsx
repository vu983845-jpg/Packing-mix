'use client';

import { useState } from 'react';
import { Settings2, Save, Users, Layers, Plus, Trash2 } from 'lucide-react';
import { MOCK_STANDARDS, formatStandardStr } from '@/lib/utils';
import { QualityStandard, RuleType } from '@/lib/types';

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('standards');
    const [standards, setStandards] = useState<QualityStandard[]>(MOCK_STANDARDS);

    const handleUpdateStandard = (id: string, field: keyof QualityStandard, value: any) => {
        setStandards(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    return (
        <div className="admin-page">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>System Administration</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage factory standards, rules, and user access</p>
            </div>

            <div className="card">
                <div className="card-header" style={{ padding: 0 }}>
                    <div style={{ display: 'flex' }}>
                        <button
                            className={`btn ${activeTab === 'standards' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'standards' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('standards')}
                        >
                            <Settings2 size={18} /> Quality Standards
                        </button>
                        <button
                            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={18} /> User Access
                        </button>
                        <button
                            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: 0, padding: '1rem 1.5rem', flex: 1, border: 'none', borderBottom: activeTab === 'settings' ? '3px solid var(--color-primary)' : '1px solid var(--border-light)' }}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Layers size={18} /> General Settings
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {activeTab === 'standards' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Standards Configuration for: <span style={{ color: 'var(--color-primary)' }}>MIX-001</span></h3>
                                <button className="btn btn-primary"><Save size={18} /> Lưu Thay Đổi</button>
                            </div>

                            <div className="data-table-wrapper" style={{ border: '1px solid var(--border-light)' }}>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '20%' }}>Indicator Name</th>
                                            <th style={{ width: '20%' }}>Rule Type</th>
                                            <th style={{ width: '15%' }}>Min Value</th>
                                            <th style={{ width: '15%' }}>Max Value</th>
                                            <th style={{ width: '20%' }}>Current Logic UI</th>
                                            <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standards.map((std) => (
                                            <tr key={std.id}>
                                                <td>{std.indicator_name}</td>
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
                                                    />
                                                </td>
                                                <td className="editable">
                                                    <input
                                                        type="number"
                                                        style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}
                                                        value={std.max_value !== null ? std.max_value : ''}
                                                        disabled={std.rule_type === 'min'}
                                                        onChange={(e) => handleUpdateStandard(std.id, 'max_value', e.target.value ? Number(e.target.value) : null)}
                                                    />
                                                </td>
                                                <td>
                                                    <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                        {formatStandardStr(std)}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button className="icon-btn" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                                <Plus size={18} /> Thêm Chỉ Tiêu (Add Indicator)
                            </button>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>User Management</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage who has access to the app, define their roles.</p>

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
                                        <td>Admin User</td>
                                        <td>admin@factory.local</td>
                                        <td><span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>Admin</span></td>
                                        <td>Active</td>
                                    </tr>
                                    <tr>
                                        <td>QA Inspector 1</td>
                                        <td>qa1@factory.local</td>
                                        <td><span style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>User</span></td>
                                        <td>Active</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>General Defaults</h3>

                            <div className="form-group">
                                <label className="form-label">Default Clusters for new inspections</label>
                                <select className="form-control">
                                    <option value="11">11 Clusters</option>
                                    <option value="10">10 Clusters</option>
                                    <option value="5">5 Clusters</option>
                                </select>
                            </div>

                            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Lưu Cài Đặt</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
