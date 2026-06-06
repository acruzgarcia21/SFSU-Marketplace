import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import Button from "./Button";
import SearchBar from "./SearchBar";

export default function Navbar({
  searchText = "",
  setSearchText = () => {},
  onSearch = () => {},
  showSearch = true,
  navItems = null,
  onLogoClick,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const isLoggedIn = !!storedUser;

  const defaultGuestItems = [
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
    { to: "/about", label: "About" },
  ];

  const defaultUserItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/about", label: "About" },
    { to: "/logout", label: "Logout" },
  ];

  const itemsToRender =
    navItems || (isLoggedIn ? defaultUserItems : defaultGuestItems);

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    window.location.href = "/";
  };
  return (
    <div className="navbar-wrapper">
      <div className="app-banner">
        SFSU Software Engineering Project CSC 648-848, Spring 2026. For
        Demonstration Only
      </div>

      <div className="navbar">
        <Link
          to="/"
          className="logo"
          onClick={() => {
            onLogoClick?.();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Switch-It-Up
        </Link>

        {showSearch && (
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            onSubmit={onSearch}
          />
        )}

        <div className="nav-right">
          {itemsToRender.map((item) =>
            item.label === "Logout" ? (
              <Button
                key="logout"
                variant="primary"
                size="md"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Logout
              </Button>
            ) : (
              <Link to={item.to} key={item.to}>
                <Button variant="primary" size="md">
                  {item.label}
                </Button>
              </Link>
            ),
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Log Out?</h2>
            <p>Are you sure you want to log out?</p>

            <div className="confirm-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>

              <Button variant="dangerSolid" size="sm" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
