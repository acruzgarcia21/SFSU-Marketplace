import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../styles/my-listings.css";

export default function MyListings() {
  const navigate = useNavigate();

  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  const currentUser = storedUser
    ? {
        id: storedUser.user_id || storedUser.id,
        name: storedUser.display_name || storedUser.name,
      }
    : null;

  const [allListings, setAllListings] = useState([]);
  const [hiddenListingIds, setHiddenListingIds] = useState([]);
  const [animatingListingIds, setAnimatingListingIds] = useState([]);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/search?category=${encodeURIComponent(
            "All",
          )}&searchText=${encodeURIComponent("")}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load listings");
        }

        setAllListings(data.results || []);
      } catch (err) {
        console.error("Error loading listings:", err);
        setError(err.message || "Something went wrong");
        setAllListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const userListings = useMemo(() => {
    if (!currentUser) return [];

    return allListings.filter((item) => {
      if (item.seller_id) {
        return Number(item.seller_id) === Number(currentUser.id);
      }

      return (
        item.seller_name &&
        item.seller_name.toLowerCase() === currentUser.name.toLowerCase()
      );
    });
  }, [allListings, currentUser]);

  const visibleListings = useMemo(() => {
    return userListings.filter(
      (item) => !hiddenListingIds.includes(item.listing_id),
    );
  }, [userListings, hiddenListingIds]);

  const getStatusLabel = (listing) => {
    if (!listing.status) return "Active";
    return listing.status;
  };

  const getStatusClass = (status) => {
    const normalized = status?.toLowerCase();

    if (normalized === "sold") return "status-badge sold";
    if (normalized === "pending") return "status-badge pending";
    return "status-badge active";
  };

  const handleMarkSold = async (listingId) => {
    setAnimatingListingIds((prev) => [...prev, listingId]);

    try {
      const response = await fetch(`/api/listing/${listingId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "sold",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark listing as sold");
      }

      setAllListings((prev) =>
        prev.map((item) =>
          item.listing_id === listingId ? { ...item, status: "sold" } : item,
        ),
      );
    } catch (err) {
      console.error("Mark sold error:", err);
      alert(err.message);
    } finally {
      setAnimatingListingIds((prev) => prev.filter((id) => id !== listingId));
    }
  };

  const handleDeleteClick = (listing) => {
    setListingToDelete(listing);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;

    const listingId = listingToDelete.listing_id;
    setAnimatingListingIds((prev) => [...prev, listingId]);

    try {
      const response = await fetch(`/api/listing/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }

      setHiddenListingIds((prev) => [...prev, listingId]);
      setListingToDelete(null);
    } catch (err) {
      console.error("Delete listing error:", err);
      alert(err.message);
    } finally {
      setAnimatingListingIds((prev) => prev.filter((id) => id !== listingId));
    }
  };

  const handleCancelDelete = () => {
    setListingToDelete(null);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="my-listings-page">
      <div className="navbar-wrapper">
        <div className="navbar">
          <Link to="/" className="logo">
            Switch-It-Up
          </Link>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search Marketplace"
              className="search-input"
              readOnly
            />
            <span className="search-icon">
              <i className="bi bi-search"></i>
            </span>
          </div>

          <div className="nav-right">
            <Link to="/dashboard">
              <button className="nav-button">Dashboard</button>
            </Link>
            <button className="nav-button">Inbox</button>
            <Link to="/about">
              <button className="nav-button">About</button>
            </Link>
          </div>
        </div>
      </div>

      <div className="my-listings-container">
        <div className="my-listings-header">
          <div>
            <h1>My Listings</h1>
            <p>Manage all your listings, edit or remove items.</p>
          </div>

          <Link to="/create-listing">
            <button className="my-listings-primary-btn">
              + Create Listing
            </button>
          </Link>
        </div>

        {loading && <p className="page-message">Loading listings...</p>}
        {error && <p className="page-message error-message">{error}</p>}

        {!loading && !error && (
          <div className="my-listings-panel">
            {visibleListings.length === 0 ? (
              <p className="empty-state">
                No listings left for {currentUser.name}.
              </p>
            ) : (
              <div className="listing-list">
                {visibleListings.map((item) => (
                  <div
                    className={`listing-row ${
                      animatingListingIds.includes(item.listing_id)
                        ? "listing-row-removing"
                        : ""
                    }`}
                    key={item.listing_id}
                    onClick={() => navigate(`/listing/${item.listing_id}`)}
                  >
                    <div className="listing-row-left">
                      <div className="listing-thumb">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>No Image</span>
                        )}
                      </div>

                      <div className="listing-row-info">
                        <h3>{item.title}</h3>
                        <p className="listing-row-price">
                          ${Number(item.price).toFixed(2)}
                        </p>
                        <span className={getStatusClass(getStatusLabel(item))}>
                          {getStatusLabel(item)}
                        </span>
                      </div>
                    </div>

                    <div className="listing-row-actions">
                      <Link to={`/listing/${item.listing_id}`}>
                        <button
                          className="small-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </button>
                      </Link>

                      <button
                        className="small-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-listing/${item.listing_id}`);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="small-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSold(item.listing_id);
                        }}
                        disabled={animatingListingIds.includes(item.listing_id)}
                      >
                        {animatingListingIds.includes(item.listing_id)
                          ? "Updating..."
                          : "Mark Sold"}
                      </button>

                      <button
                        className="small-btn danger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {listingToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Listing?</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{listingToDelete.title}</strong>? This action cannot be
              undone.
            </p>

            <div className="delete-modal-actions">
              <button className="small-btn" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button
                className="small-btn danger-btn solid-danger-btn"
                onClick={handleConfirmDelete}
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

