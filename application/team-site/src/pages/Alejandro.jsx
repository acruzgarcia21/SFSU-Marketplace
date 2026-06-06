import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function Alejandro() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img
              src="/images/alejandro.png"
              alt="Alejandro Cruz-Garcia"
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Alejandro Cruz-Garcia
            </h1>
            <h3 className="profile-role">
              Team Lead
            </h3>

            <p className="profile-description">
              Hello, my name is Alejandro and I am the team lead for this project.
              I am responsible for leading my group, delegating tasks, providing
              feedback, and overseeing the overall production of our application.
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