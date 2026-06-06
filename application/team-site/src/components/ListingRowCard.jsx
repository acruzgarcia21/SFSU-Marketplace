import { Link } from "react-router-dom";
import "./ListingRowCard.css";
import Button from "./Button";

export default function ListingRowCard({
  item,
  isSelling = false,
  isDeleting = false,
  onRowClick,
  onEdit,
  onMarkSold,
  onDelete,
  getStatusLabel,
  getStatusClass,
}) {
  const getListingImageSrc = (image) => {
    if (!image) return "";
    if (image.startsWith("/images/")) return image;
    if (image.startsWith("http")) return image;
    return `/api/listing/image/${image}`;
  };

  return (
    <div
      className={`listing-row-card ${
        isSelling ? "listing-row-card--selling" : ""
      } ${isDeleting ? "listing-row-card--deleting" : ""}`}
      onClick={onRowClick}
    >
      <div className="listing-row-card__left">
        <div className="listing-row-card__thumb">
          {item.image ? (
            <img
              src={getListingImageSrc(item.image)}
              alt={item.title}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span>No Image</span>
          )}
        </div>

        <div className="listing-row-card__info">
          <h3>{item.title}</h3>
          <p className="listing-row-card__price">
            {Number(item.price) === 0
              ? "Free"
              : `$${Number(item.price).toFixed(2)}`}
          </p>

          <span className={getStatusClass(getStatusLabel(item))}>
            {getStatusLabel(item)}
          </span>
        </div>
      </div>

      <div className="listing-row-card__actions">
        <Link
          to={`/listing/${item.listing_id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onMarkSold();
          }}
          disabled={isSelling || isDeleting}
        >
          {isSelling ? "Updating..." : "Mark Sold"}
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting || isSelling}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}