import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function Akash() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img src="/images/akash.jpg" alt="Akash Goyal" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Akash Goyal
            </h1>
            <h3 className="profile-role">
              Backend Lead
            </h3>

            <p className="profile-description">
              Hello, I’m Akash Goyal, the Backend Lead for CSC-648 Team 4.
              I focus on building reliable APIs, managing the server and database,
              and ensuring smooth integration between frontend and backend systems.
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