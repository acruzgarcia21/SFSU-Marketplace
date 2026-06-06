import "./StatCard.css";

export default function StatCard({ label, value, className = "" }) {
  return (
    <div className={`stat-card ${className}`}>
      <span className="stat-card__label">{label}</span>
      <h2 className="stat-card__value">{value}</h2>
    </div>
  );
}