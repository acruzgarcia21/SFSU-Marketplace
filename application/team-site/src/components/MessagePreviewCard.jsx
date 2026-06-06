import "./MessagePreviewCard.css";

export default function MessagePreviewCard({
  message,
  onClick,
  isActive = false,
}) {
  return (
    <div
      className={`message-preview-card ${isActive ? "message-preview-card--active" : ""}`}
      onClick={onClick}
    >
      <div className="message-preview-card__top">
        <div className="message-preview-card__avatar">
          {message.name.charAt(0)}
        </div>

        <div className="message-preview-card__body">
          <div className="message-preview-card__header-row">
            <div className="message-preview-card__name-row">
              <h3>{message.name}</h3>
              {message.unread && <span className="unread-dot"></span>}
            </div>

            <span className="message-preview-card__time">{message.time}</span>
          </div>

          <p className="message-preview-card__listing">
            About: {message.listingTitle}
          </p>

          <p className="message-preview-card__preview">{message.preview}</p>
        </div>
      </div>
    </div>
  );
}