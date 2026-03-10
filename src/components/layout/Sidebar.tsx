'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FileSignature, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    window.localStorage.removeItem('demo_auth');
    window.localStorage.removeItem('demo_user');
    router.push('/login');
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">Mix Tracker</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/inspections" className={`nav-link ${pathname.startsWith('/inspections') ? 'active' : ''}`}>
              <FileSignature size={20} />
              <span>Inspections</span>
            </Link>
          </li>
          <li>
            <Link href="/reports" className={`nav-link ${pathname.startsWith('/reports') ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Reports</span>
            </Link>
          </li>
          <li>
            <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          {/* <UserCircle size={24} /> */} {/* UserCircle removed as per instruction */}
          <div className="user-details">
            <span className="user-name">Packing Team</span>
            <span className="user-role">packing@dds.com</span>
          </div>
        </div>
        <button className="logout-btn" title="Logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
