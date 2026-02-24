import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Smartphone,
    Upload,
    BarChart3,
    AlertTriangle,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/produtos', icon: Smartphone, label: 'Produtos' },
    { to: '/importar', icon: Upload, label: 'Importar Excel' },
    { to: '/estoque', icon: AlertTriangle, label: 'Controle Estoque' },
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Smartphone size={22} />
                    </div>
                    <div className="sidebar-logo-text">
                        <h1>CapasReport</h1>
                        <span>Gestão de Capas</span>
                    </div>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
