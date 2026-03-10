'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Plus, Filter, AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pass: 0, fail: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // We still use mock data for charts initially unless we aggregate everything 
  // For production, we would write an RPC function in Supabase to aggregate daily standard vs actual
  const mockChartData = [
    { name: 'Hạt', actual: 310, standard: 310 },
    { name: 'Bể', actual: 15, standard: 30 },
    { name: 'LP ss', actual: 1.2, standard: 2 },
    { name: 'A', actual: 0.8, standard: 1.5 },
    { name: 'B', actual: 2, standard: 4 },
    { name: 'C', actual: 5, standard: 7.5 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch recent inspections
        const { data: recentData } = await supabase
          .from('inspections')
          .select(`
            id, inspection_date, shift, container_no, isp_no, inspector_name, result, status,
            products ( product_code )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentData) {
          setInspections(recentData);
        }

        // Fetch basic stats for today
        const today = new Date().toISOString().split('T')[0];
        const { data: todayStats } = await supabase
          .from('inspections')
          .select('id, result')
          .eq('inspection_date', today);

        if (todayStats) {
          const passCount = todayStats.filter(i => i.result === 'PASS').length;
          const failCount = todayStats.filter(i => i.result === 'FAIL' || i.result === 'CLUSTER_ABNORMAL').length;
          setStats({
            total: todayStats.length,
            pass: passCount,
            fail: failCount
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          <span className="kpi-value">{isLoading ? '...' : stats.total}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on daily input</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Passed Lots</span>
          <span className="kpi-value" style={{ color: 'var(--color-success)' }}>{isLoading ? '...' : stats.pass}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : 0}% passing rate
          </span>
        </div>
        <div className="kpi-card" style={{ borderColor: 'var(--color-danger-light)', background: 'var(--color-danger-light)' }}>
          <span className="kpi-title" style={{ color: 'var(--color-danger-dark)' }}>Failed Lots</span>
          <span className="kpi-value" style={{ color: 'var(--color-danger-dark)' }}>{isLoading ? '...' : stats.fail}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger-dark)' }}>Requires attention</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Database Status</span>
          <span className="kpi-value" style={{ color: '#3b82f6' }}>Live</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connected to Supabase</span>
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
                <Bar dataKey="actual" name="Actual Avg (Demo)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
          <h3>Recent Inspections (Live from Database)</h3>
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
                {isLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading realtime data...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No inspections recorded yet.</td></tr>
                ) : (
                  inspections.map((isp: any) => (
                    <tr key={isp.id}>
                      <td>{isp.inspection_date}</td>
                      <td>{isp.shift}</td>
                      <td>{isp.products?.product_code || 'MIX-001'}</td>
                      <td>{isp.container_no}</td>
                      <td>{isp.isp_no}</td>
                      <td>{isp.inspector_name}</td>
                      <td style={{ textAlign: 'center' }}>
                        {isp.result === 'PASS' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                            <CheckCircle2 size={16} /> PASS
                          </span>
                        ) : isp.result === 'CLUSTER_ABNORMAL' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)' }}>
                            <FileWarning size={16} /> WARNING
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}>
                            <AlertTriangle size={16} /> FAIL
                          </span>
                        )}
                      </td>
                      <td>
                        <Link href={`/inspections/${isp.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
