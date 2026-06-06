import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/about.css";

export default function About() {
  const members = [
    { name: "Krish Adya", path: "/krish" },
    { name: "Alejandro Cruz-Garcia", path: "/alejandro" },
    { name: "Akash Goyal", path: "/akash" },
    { name: "Gerious Heishan", path: "/gerious" },
    { name: "Joshua Muhammad", path: "/joshua-m" },
    { name: "Kyle Munar", path: "/kyle" },
    { name: "Joshua Oakes", path: "/joshua-o" },
    { name: "Keith Tang", path: "/keith" },
  ];

  return (
    <div className="about-page">
      <Navbar showSearch={false} />

      <div className="about-container">
        <h1 className="about-title">
          Software Engineering Class - SFSU
        </h1>

        <div className="about-subtext">
          <p>Spring 2026</p>
          <p>Section 04</p>
          <p>Team 04</p>
        </div>

        <Link to="/">
        <Button
        variant="primary"
        size="lg"
        className="about-back-btn"
        >
        Back to Marketplace
        </Button>
        </Link>

        <div className="about-grid">
          {members.map((m) => (
            <Link key={m.path} to={m.path}>
              <Button
                variant="outline"
                size="md"
                className="about-member-btn"
              >
                {m.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}