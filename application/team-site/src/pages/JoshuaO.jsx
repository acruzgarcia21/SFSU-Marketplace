import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function JoshuaO() {
  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {/* LEFT IMAGE */}
          <div className="profile-image">
            <img src="/images/anon.png" alt="Joshua Oakes" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="profile-content">
            <h1 className="profile-name">
              Joshua Oakes
            </h1>
            <h3 className="profile-role">
              Frontend Assistant
            </h3>

            <p className="profile-description">
              Hello, my name is Joshua Oakes and I am a Frontend Assistant for the team.
              I support the frontend lead with development tasks and UI design improvements.
              I’m an avid gamer and music enthusiast, with Porter Robinson being my favorite artist.
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