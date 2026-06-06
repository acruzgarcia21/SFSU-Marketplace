import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function Krish() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img src="/images/krish.jpg" alt="Krish Adya" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Krish Adya
            </h1>

            <h3 className="profile-role">
              Frontend Lead
            </h3>

            <p className="profile-description">
              Hi, I am Krish Adya. I am responsible for frontend architecture
              and UI design for Team 04 in CSC 648. I focus on building clean,
              responsive, and scalable user interfaces.
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