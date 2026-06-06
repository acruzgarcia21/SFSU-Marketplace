import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function JoshuaM() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img src="/images/anon.png" alt="Joshua Muhammad" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Joshua Muhammad
            </h1>
            <h3 className="profile-role">
              GitHub Lead
            </h3>

            <p className="profile-description">
              I'm a senior set to graduate in Fall 2026. I enjoy skating
              and I’m a big fan of the Halo franchise. As GitHub Lead,
              I help manage our repository workflow and maintain clean,
              organized version control for the team.
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