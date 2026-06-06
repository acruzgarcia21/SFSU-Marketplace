import "./Panel.css";

export default function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`shared-panel ${className}`}>
      {(title || subtitle || action) && (
        <div className="shared-panel__header">
          <div className="shared-panel__header-text">
            {title && <h2 className="shared-panel__title">{title}</h2>}
            {subtitle && <p className="shared-panel__subtitle">{subtitle}</p>}
          </div>

          {action && <div className="shared-panel__action">{action}</div>}
        </div>
      )}

      <div className={`shared-panel__body ${bodyClassName}`}>{children}</div>
    </section>
  );
}