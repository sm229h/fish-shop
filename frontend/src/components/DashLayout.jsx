import { NavLink } from 'react-router-dom';

export default function DashLayout({ items, children }) {
  return (
    <div className="container">
      <div className="dash-layout">
        <aside className="dash-sidebar">
          {items.map((group, gi) => (
            <div key={gi}>
              {group.title && <h3>{group.title}</h3>}
              {group.links.map(link => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) => isActive ? 'active' : ''}>
                  <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
