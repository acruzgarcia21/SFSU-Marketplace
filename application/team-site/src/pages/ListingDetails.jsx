import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/listing-details.css";

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [showMessageUI, setShowMessageUI] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageThread, setMessageThread] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const [authPrompt, setAuthPrompt] = useState("");

  const messageBodyRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"))
      );
    } catch {
      return null;
    }
  }, []);

  const currentUserId = currentUser?.user_id || currentUser?.id || null;
  const currentUserName =
    currentUser?.display_name || currentUser?.name || "You";
  const isLoggedIn = Boolean(currentUserId);

  const getListingImageSrc = (image) => {
    if (!image) return "";
    if (image.startsWith("/images/")) return image;
    if (image.startsWith("http")) return image;
    return `/api/listing/image/${image}`;
  };

  const scrollMessagesToBottom = () => {
    if (!messageBodyRef.current) return;
    messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight;
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/listing/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load listing");
        }

        const loadedListing = data.listing || null;

        if (loadedListing?.listing_id) {
          const imagesResponse = await fetch(
            `/api/listing/${loadedListing.listing_id}/images`,
          );

          const imagesData = await imagesResponse.json();

          loadedListing.images = imagesResponse.ok
            ? imagesData.images || []
            : [];
        }

        setListing(loadedListing);
      } catch (err) {
        console.error("Error loading listing:", err);
        setError(err.message || "Something went wrong");
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  useEffect(() => {
    if (showMessageUI) {
      requestAnimationFrame(() => {
        scrollMessagesToBottom();
      });
    }
  }, [showMessageUI, messageThread]);

  const galleryImages = useMemo(() => {
    if (Array.isArray(listing?.images) && listing.images.length > 0) {
      return listing.images;
    }

    if (listing?.image) {
      return [listing.image];
    }

    return [];
  }, [listing]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedIndex(0);
      setSelectedImage(galleryImages[0]);
      setIsMagnifying(false);
    }
  }, [galleryImages]);

  const requireLogin = (actionText) => {
    if (isLoggedIn) return true;

    navigate("/login", {
      state: {
        message: `Please log in to ${actionText}.`,
      },
    });

    return false;
  };

  const formatMessageThread = (messages) => {
    return (messages || []).map((msg) => ({
      id: msg.message_id,
      senderName: msg.display_name,
      body: msg.body,
      sentAt: msg.sent_at
        ? new Date(msg.sent_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));
  };

  const fetchMessagesByConversationId = async (chatId) => {
    const response = await fetch(`/api/messages/${chatId}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load messages");
    }

    setMessageThread(formatMessageThread(data.messages));
  };

  const loadExistingConversation = async () => {
    if (!currentUserId || !listing?.seller_id || !listing?.listing_id) return;

    try {
      setIsLoadingMessages(true);
      setMessageError("");

      const response = await fetch("/api/messages", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      const existingChat = (data.chats || []).find((chat) => {
        return (
          Number(chat.listing_id) === Number(listing.listing_id) &&
          Number(chat.other_user_id) === Number(listing.seller_id)
        );
      });

      if (!existingChat) {
        setConversationId(null);
        setMessageThread([]);
        return;
      }

      setConversationId(existingChat.chatId);
      await fetchMessagesByConversationId(existingChat.chatId);
    } catch (err) {
      console.error("Load existing conversation error:", err);
      setMessageError(err.message || "Failed to load conversation.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleMessageClick = async () => {
    if (!requireLogin("message the seller")) return;

    setMessageError("");
    setShowMessageUI(true);
    await loadExistingConversation();
  };

  const handleOfferClick = () => {
    if (!requireLogin("make an offer")) return;

    setOfferError("");
    setShowOfferModal(true);
  };

  const handleImageMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleImageLeave = () => {
    if (isMagnifying) setIsMagnifying(false);
  };

  const handlePreviousImage = () => {
    if (galleryImages.length <= 1) return;

    const nextIndex =
      selectedIndex === 0 ? galleryImages.length - 1 : selectedIndex - 1;

    setSelectedIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
    setIsMagnifying(false);
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;

    const nextIndex =
      selectedIndex === galleryImages.length - 1 ? 0 : selectedIndex + 1;

    setSelectedIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
    setIsMagnifying(false);
  };

  const handleWishlistToggle = () => {
    if (!requireLogin("add listings to your wishlist")) return;

    if (isWishlisted) {
      setIsShrinking(true);
      setTimeout(() => setIsShrinking(false), 250);
    }

    setIsWishlisted((prev) => !prev);
  };

  const handleSendMessage = async () => {
    if (!requireLogin("message the seller")) return;

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setMessageError("Message cannot be empty.");
      return;
    }

    if (!listing?.seller_id || !listing?.listing_id) {
      setMessageError("Seller or listing information is missing.");
      return;
    }

    try {
      setIsSendingMessage(true);
      setMessageError("");

      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: listing.seller_id,
          listing_id: listing.listing_id,
          body: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setConversationId(data.chatId || conversationId);
      setMessage("");

      if (data.chatId) {
        await fetchMessagesByConversationId(data.chatId);
      } else {
        setMessageThread((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            senderName: currentUserName,
            body: trimmedMessage,
            sentAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessageError(err.message || "Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!requireLogin("make an offer")) return;

    const amount = Number(offerAmount);

    if (!offerAmount || Number.isNaN(amount) || amount <= 0) {
      setOfferError("Offer amount must be greater than $0.");
      return;
    }

    if (!listing?.listing_id) {
      setOfferError("Listing information is missing.");
      return;
    }

    try {
      setOfferError("");
      setIsSubmittingOffer(true);

      const response = await fetch("/api/offers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listing.listing_id,
          offer_amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit offer");
      }

      alert(`Offer submitted: $${amount.toFixed(2)}`);
      setOfferAmount("");
      setOfferMessage("");
      setShowOfferModal(false);
    } catch (err) {
      console.error("Submit offer error:", err);
      setOfferError(err.message || "Failed to submit offer.");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  if (loading) {
    return <div className="details-page-message">Loading listing...</div>;
  }

  if (error) {
    return <div className="details-page-message error-message">{error}</div>;
  }

  if (!listing) {
    return <div className="details-page-message">Listing not found.</div>;
  }

  const displayPrice =
    Number(listing.price) === 0
      ? "Free"
      : `$${Number(listing.price).toFixed(2)}`;

  const isListingOwner =
    currentUserId && Number(currentUserId) === Number(listing.seller_id);

  if (listing.status === "pending" && !isListingOwner) {
    return (
      <div className="details-page-message">
        This listing is pending approval and is not publicly available yet.
      </div>
    );
  }

  return (
    <div className="listing-details-page">
      <Navbar
        showSearch
        searchText={searchText}
        setSearchText={setSearchText}
        onSearch={(submittedValue) => {
          navigate(`/?search=${encodeURIComponent(submittedValue)}`);
        }}
      />

      <div className="details-container">
        {authPrompt && (
          <div className="auth-prompt">
            <span>{authPrompt}</span>
            <button type="button" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        )}

        <div className="details-main">
          <div className="details-left">
            <div className="gallery-card">
              <div className="main-image-box">
                {selectedImage && (
                  <button
                    className="expand-image-btn"
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    aria-label="Expand image"
                  >
                    <i className="bi bi-arrows-fullscreen"></i>
                  </button>
                )}

                <div
                  className={`main-image-stage ${
                    isMagnifying ? "magnifying" : ""
                  }`}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageLeave}
                  onClick={() =>
                    selectedImage && setIsMagnifying((prev) => !prev)
                  }
                >
                  {selectedImage ? (
                    <img
                      src={getListingImageSrc(selectedImage)}
                      alt={listing.title}
                      className="main-product-image"
                      style={
                        isMagnifying
                          ? {
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }
                          : {}
                      }
                    />
                  ) : (
                    <div className="image-placeholder">Image of Product</div>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <>
                    <button
                      className="gallery-arrow left-arrow"
                      type="button"
                      onClick={handlePreviousImage}
                      aria-label="Previous image"
                    >
                      &#8249;
                    </button>

                    <button
                      className="gallery-arrow right-arrow"
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                    >
                      &#8250;
                    </button>
                  </>
                )}
              </div>

              {galleryImages.length > 0 && (
                <div className="thumbnail-row">
                  {galleryImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      className={`thumbnail-box ${
                        selectedIndex === index ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedIndex(index);
                        setSelectedImage(img);
                        setIsMagnifying(false);
                      }}
                    >
                      <img
                        src={getListingImageSrc(img)}
                        alt={`Thumbnail ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="description-block">
              <h3>Description of Product</h3>
              <p>{listing.description || "No description provided."}</p>
            </div>
          </div>

          <div className="details-right">
            <div className="product-info-card">
              <h1>{listing.title}</h1>

              <div className="price-line">
                <span className="main-price">{displayPrice}</span>
                {Number(listing.price) !== 0 && (
                  <span className="offer-text"> or Best Offer</span>
                )}
              </div>

              <p className="condition-line">
                Condition: <strong>{listing.condition || "Like New"}</strong>
              </p>

              <div className="info-divider"></div>

              <div className="action-buttons">
                <Button
                  variant="primary"
                  size="md"
                  className="details-btn details-btn-primary"
                  onClick={handleMessageClick}
                >
                  Message Seller
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="details-btn"
                  onClick={handleOfferClick}
                >
                  Make Offer
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className={`details-btn wishlist-btn ${
                    isWishlisted ? "active" : ""
                  } ${isShrinking ? "shrinking" : ""}`}
                  onClick={handleWishlistToggle}
                >
                  <i
                    className={`bi ${
                      isWishlisted ? "bi-heart-fill" : "bi-heart"
                    }`}
                  />
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </Button>
              </div>

              <div className="info-divider"></div>

              <div className="seller-block">
                <div className="seller-avatar">
                  {listing.seller_name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="seller-meta">
                  <p>{listing.seller_name || "Username of Seller"}</p>
                </div>
              </div>

              <div className="extra-info">
                <p>
                  <strong>Category:</strong> {listing.category_name || "N/A"}
                </p>

                {listing.course_tag && listing.course_tag !== "N/A" && (
                  <p>
                    <strong>Course Tag:</strong> {listing.course_tag}
                  </p>
                )}

                <p>
                  <strong>Pickup Location:</strong>{" "}
                  {listing.pickup_location || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && selectedImage && (
        <div
          className="image-lightbox"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close expanded image"
          >
            <i className="bi bi-x-lg"></i>
          </button>

          <img
            src={getListingImageSrc(selectedImage)}
            alt={listing.title}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showOfferModal && (
        <div className="modal-overlay" onClick={() => setShowOfferModal(false)}>
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="offer-header">
              <h3>Make an Offer</h3>
              <p className="offer-listed-price">Listed at {displayPrice}</p>
            </div>

            <div className="offer-field">
              <label>Offer Amount</label>
              <div
                className={`offer-input-wrapper ${
                  offerError ? "offer-error-border" : ""
                }`}
              >
                <span className="offer-currency">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter your offer"
                  value={offerAmount}
                  onChange={(e) => {
                    setOfferAmount(e.target.value);
                    if (offerError) setOfferError("");
                  }}
                />
              </div>
              {offerError && <p className="offer-error-text">{offerError}</p>}
            </div>

            <div className="offer-field">
              <label>Message to Seller (Optional)</label>
              <textarea
                className="offer-textarea"
                placeholder="Write a message to the seller..."
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
              />
            </div>

            <div className="offer-actions">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setShowOfferModal(false)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="md"
                type="button"
                disabled={isSubmittingOffer}
                className={`offer-submit-btn ${
                  isSubmittingOffer ? "loading" : ""
                }`}
                onClick={handleSubmitOffer}
              >
                {isSubmittingOffer ? "Submitting..." : "Submit Offer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showMessageUI && (
        <div
          className="message-overlay"
          onClick={() => setShowMessageUI(false)}
        >
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="message-header">
              <div className="message-header-text">
                <h3>{listing.seller_name || "Seller"}</h3>
                <p className="message-product-mini">About: {listing.title}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setShowMessageUI(false)}
              >
                Close
              </Button>
            </div>

            <div className="message-body" ref={messageBodyRef}>
              {isLoadingMessages ? (
                <p className="message-empty-state">Loading messages...</p>
              ) : messageThread.length === 0 ? (
                <p className="message-empty-state">
                  No messages yet. Start the conversation below.
                </p>
              ) : (
                messageThread.map((msg, index) => {
                  const isCurrentUser = msg.senderName === currentUserName;

                  return (
                    <div
                      key={msg.id || index}
                      className={
                        isCurrentUser
                          ? "conversation-message own"
                          : "conversation-message"
                      }
                    >
                      <div className="conversation-message-content">
                        <div className="conversation-sender">
                          {isCurrentUser ? "You" : msg.senderName}
                        </div>

                        <div className="conversation-bubble">
                          <p>{msg.body}</p>
                        </div>

                        <div className="conversation-time">{msg.sentAt}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="message-footer">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (messageError) setMessageError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSendingMessage}
              >
                {isSendingMessage ? "Sending..." : "Send"}
              </button>
            </div>

            {messageError && (
              <p className="message-error-text">{messageError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
