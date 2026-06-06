import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function Gerious() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img src="/images/anon.png" alt="Gerious Heishan" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Gerious Heishan
            </h1>
            <h3 className="profile-role">
              Backend Assistant
            </h3>

            <p className="profile-description">
              Hello, I’m Gerious Heishan. I support the backend team by assisting
              with API development, database tasks, and ensuring smooth system
              functionality throughout the application.
            </p>

            <div style={{ marginTop: "30px" }}>
              <Link to="/about">
                <Button variant="primary" size="md">
                  Back to About
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}