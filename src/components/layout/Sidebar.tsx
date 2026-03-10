import { ReactNode } from 'react';
import Link from 'next/link';
import { Home, ClipboardList, Settings, UserCircle, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">Mix Tracker</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link href="/" className="nav-link">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/inspections/new" className="nav-link">
              <ClipboardList size={20} />
              <span>New Inspection</span>
            </Link>
          </li>
          <li>
            <Link href="/admin" className="nav-link">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <UserCircle size={24} />
          <div className="user-details">
            <span className="user-name">Admin User</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
        <button className="logout-btn">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
