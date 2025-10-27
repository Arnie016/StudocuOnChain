import { NavLink } from "react-router-dom";

const navLinks = [
    { path: "/EE4032", label: "Login", exact: true },
    { path: "/InterfaceDemo/profile", label: "Profile" },
    { path: "/InterfaceDemo/storage", label: "Storage" },
    { path: "/InterfaceDemo/history", label: "History" },
    { path: "/InterfaceDemo/leader", label: "Leader" }
];

export const GlobalToolBar = () => (
    <nav className="global-nav">
        <div className="global-nav__brand">
            <div className="global-nav__logo">Ξ</div>
            <div className="global-nav__meta">
                <span>Studocu OnChain</span>
                <strong>Interface Demo</strong>
            </div>
        </div>
        <div className="global-nav__links">
            {navLinks.map((link) => (
                <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.exact}
                    className={({ isActive }) =>
                        `global-nav__link${isActive ? " is-active" : ""}`
                    }
                >
                    {link.label}
                </NavLink>
            ))}
        </div>
    </nav>
);
