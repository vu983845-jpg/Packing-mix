'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Plus, Filter, AlertTriangle, CheckCircle2, FileWarning, RefreshCw, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_STANDARDS } from '@/lib/utils'; // fallback for standard limits

export default function Dashboard() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pass: 0, fail: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Realtime Chart Data
  const [chartData, setChartData] = useState<any[]>([]);

  // Filtering
  const [availableContainers, setAvailableContainers] = useState<string[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('ALL');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch recent inspections (apply container filter globally to everything)
      let query = supabase
        .from('inspections')
        .select(`
          id, inspection_date, shift, container_no, isp_no, inspector_name, result, status, cluster_count,
          products ( product_code )
        `)
        .eq('inspection_date', today)
        .order('created_at', { ascending: false });

      if (selectedContainer !== 'ALL') {
        query = query.eq('container_no', selectedContainer);
      }

      const { data: recentData } = await query;

      if (recentData) {
        setInspections(recentData);

        // Basic stats
        const passCount = recentData.filter(i => i.result === 'PASS').length;
        const failCount = recentData.filter(i => i.result === 'FAIL' || i.result === 'CLUSTER_ABNORMAL').length;
        setStats({
          total: recentData.length,
          pass: passCount,
          fail: failCount
        });

        // 2. Fetch all unique containers for today (only if not already loaded, or we could just fetch all today)
        const { data: allToday } = await supabase.from('inspections').select('container_no').eq('inspection_date', today);
        if (allToday) {
          const uniqueConts = Array.from(new Set(allToday.map(i => i.container_no).filter(Boolean)));
          setAvailableContainers(uniqueConts as string[]);
        }

        // 3. Aggregate Chart Data
        const inspectionIds = recentData.map(i => i.id);

        if (inspectionIds.length > 0) {
          const { data: summaries } = await supabase
            .from('inspection_summary')
            .select('*')
            .in('inspection_id', inspectionIds);

          if (summaries) {
            // Aggregate averages by indicator
            const indicatorMap: Record<string, { sum: number, count: number }> = {};
            summaries.forEach(s => {
              if (!indicatorMap[s.indicator_name]) indicatorMap[s.indicator_name] = { sum: 0, count: 0 };
              if (s.avg_value !== null) {
                indicatorMap[s.indicator_name].sum += Number(s.avg_value);
                indicatorMap[s.indicator_name].count++;
              }
            });

            // Map to chart format, comparing with standards
            const liveChartData = MOCK_STANDARDS.map(std => {
              const agg = indicatorMap[std.indicator_name];
              const actualVal = agg && agg.count > 0 ? Number((agg.sum / agg.count).toFixed(2)) : 0;
              return {
                name: std.indicator_name,
                actual: actualVal,
                standard: std.rule_type === 'range' ? std.max_value : (std.max_value || std.min_value || 0)
              };
            });
            setChartData(liveChartData);
          }
        } else {
          // Reset chart if no data
          setChartData(MOCK_STANDARDS.map(std => ({
            name: std.indicator_name,
            actual: 0,
            standard: std.rule_type === 'range' ? std.max_value : (std.max_value || std.min_value || 0)
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
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
      fetchDashboardData(); // Also refresh the dashboard chart stats
    } catch (error: any) {
      console.error('Lỗi khi xóa:', error);
      alert('Lỗi xóa dữ liệu: ' + error.message);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedContainer]); // refetch when container changes

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quality Live Tracking</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time cluster tracking and aggregation</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Cont No:</span>
            <select
              value={selectedContainer}
              onChange={e => setSelectedContainer(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}
            >
              <option value="ALL">All Containers (Today)</option>
              {availableContainers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Refresh Data">
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>

          <Link href="/inspections/new" className="btn btn-primary">
            <Plus size={18} /> New Batch
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <span className="kpi-title">Total Lots (Filtered)</span>
          <span className="kpi-value">{isLoading ? '...' : stats.total}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedContainer === 'ALL' ? 'Across all lines' : `Container: ${selectedContainer}`}</span>
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
          <span className="kpi-title">Total Clusters Evaluated</span>
          <span className="kpi-value" style={{ color: '#3b82f6' }}>
            {isLoading ? '...' : inspections.reduce((acc, curr) => acc + (curr.cluster_count || 0), 0)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sampling coverage</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Aggregated Average (Realtime)</h3>
          </div>
          <div className="card-body chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="actual" name="Live Actual Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="standard" name="Standard Limit" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Quality Profile Radar (Realtime)</h3>
          </div>
          <div className="card-body chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                <Radar name="Live Area" dataKey="actual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="card">
        <div className="card-header">
          <h3>Progressive Tracking Table</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-sticky">Mã Lô (ISP)</th>
                  <th>Ngày / Ca</th>
                  <th>Container</th>
                  <th>Mã Hàng</th>
                  <th>Số Cụm (Clusters)</th>
                  <th>Người KT</th>
                  <th>Kết Quả</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading realtime data...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No data found for this container today.</td></tr>
                ) : (
                  inspections.map((inspection: any) => (
                    <tr key={inspection.id}>
                      <td>{inspection.isp_no || '-'}</td>
                      <td>{inspection.inspection_date} / {inspection.shift}</td>
                      <td style={{ fontWeight: 600 }}>{inspection.container_no || '-'}</td>
                      <td>{inspection.products?.product_code || 'MIX-001'}</td>
                      <td>{inspection.cluster_count}</td>
                      <td>{inspection.inspector_name || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {inspection.result === 'PASS' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                            <CheckCircle2 size={16} /> PASS
                          </span>
                        ) : inspection.result === 'CLUSTER_ABNORMAL' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)' }}>
                            <FileWarning size={16} /> WARNING
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}>
                            <AlertTriangle size={16} /> FAIL
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/inspections/${inspection.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            <Edit size={14} /> Sửa
                          </Link>
                          <button
                            onClick={(e) => handleDelete(inspection.id, e)}
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', border: 'none' }}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
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
