'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Plus, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';

const mockChartData = [
  { name: 'Hạt', actual: 310, standard: 310 },
  { name: 'Bể', actual: 15, standard: 30 },
  { name: 'LP ss', actual: 1.2, standard: 2 },
  { name: 'A', actual: 0.8, standard: 1.5 },
  { name: 'B', actual: 2, standard: 4 },
  { name: 'C', actual: 5, standard: 7.5 },
];

const mockPieData = [
  { name: 'Pass', value: 85 },
  { name: 'Fail', value: 15 },
];
const COLORS = ['#10b981', '#ef4444'];

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quality Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of factory mix quality performance today</p>
        </div>
        <Link href="/inspections/new" className="btn btn-primary">
          <Plus size={18} /> New Inspection
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <span className="kpi-title">Total Inspections Today</span>
          <span className="kpi-value">24</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across 3 shifts</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Passed Lots</span>
          <span className="kpi-value" style={{ color: 'var(--color-success)' }}>21</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>87.5% passing rate</span>
        </div>
        <div className="kpi-card" style={{ borderColor: 'var(--color-danger-light)', background: 'var(--color-danger-light)' }}>
          <span className="kpi-title" style={{ color: 'var(--color-danger-dark)' }}>Failed Lots</span>
          <span className="kpi-value" style={{ color: 'var(--color-danger-dark)' }}>3</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger-dark)' }}>Requires attention</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Avg Defect Rate</span>
          <span className="kpi-value">12.4</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Standard max 29</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Actual vs Standard (MIX-001)</h3>
          </div>
          <div className="card-body chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="actual" name="Actual Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="standard" name="Standard Limit" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Quality Profile Radar</h3>
          </div>
          <div className="card-body chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockChartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                <Radar name="Actual" dataKey="actual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Inspections</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Product</th>
                  <th>Cont No</th>
                  <th>ISP No</th>
                  <th>Inspector</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2024-05-20</td>
                  <td>Shift 1</td>
                  <td>MIX-001</td>
                  <td>CONT-8890</td>
                  <td>ISP-2401</td>
                  <td>Nguyen Van A</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                      <CheckCircle2 size={16} /> PASS
                    </span>
                  </td>
                  <td><button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</button></td>
                </tr>
                <tr>
                  <td>2024-05-20</td>
                  <td>Shift 1</td>
                  <td>MIX-001</td>
                  <td>CONT-8891</td>
                  <td>ISP-2402</td>
                  <td>Tran Thi B</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}>
                      <AlertTriangle size={16} /> FAIL (Bể high)
                    </span>
                  </td>
                  <td><button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
