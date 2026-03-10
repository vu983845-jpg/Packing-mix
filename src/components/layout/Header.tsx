import { ReactNode } from 'react';
import { Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="page-title">
          <h1>Mix Quality System</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Notifications">
             <Bell size={20} />
             <span className="badge">3</span>
          </button>
        </div>
      </div>
    </header>
  );
}
