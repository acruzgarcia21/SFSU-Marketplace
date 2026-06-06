import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Panel from "../components/Panel";
import StatCard from "../components/StatCard";
import ListingRowCard from "../components/ListingRowCard";
import MessagePreviewCard from "../components/MessagePreviewCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedThread, setSelectedThread] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");

  const [dashboardSearchText, setDashboardSearchText] = useState("");
  const [listingTab, setListingTab] = useState("active");

  const [visibleOffers, setVisibleOffers] = useState([]);
  const [offerToAccept, setOfferToAccept] = useState(null);
  const [offerToDecline, setOfferToDecline] = useState(null);
  const [animatingAcceptedOfferIds, setAnimatingAcceptedOfferIds] = useState([]);
  const [animatingDeclinedOfferIds, setAnimatingDeclinedOfferIds] = useState([]);

  const [listingToDelete, setListingToDelete] = useState(null);
  const [listingToMarkSold, setListingToMarkSold] = useState(null);
  const [animatingSoldIds, setAnimatingSoldIds] = useState([]);
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([]);

  const messageInputRef = useRef(null);
  const messageThreadRef = useRef(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          navigate("/login");
          return;
        }

        setCurrentUser({
          id: data.user.id || data.user.user_id,
          name: data.user.display_name,
        });
      } catch (err) {
        navigate("/login");
      } finally {
        setAuthChecked(true);
      }
    };

    checkSession();
  }, [navigate]);

  const scrollThreadToBottom = () => {
    if (!messageThreadRef.current) return;
    messageThreadRef.current.scrollTop = messageThreadRef.current.scrollHeight;
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      const formatted = (data.chats || []).map((chat) => ({
        id: chat.chatId,
        name: chat.other_user_name || `Conversation ${chat.chatId}`,
        receiverId: chat.other_user_id,
        listingId: chat.listing_id,
        listingTitle: chat.listing_title || "Listing conversation",
        preview: chat.latest_message || "No messages yet",
        time: chat.latest_message_time
          ? new Date(chat.latest_message_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unread: true,
      }));

      setMessages(formatted);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  const fetchConversationMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load messages");
      }

      const formattedThread = (data.messages || []).map((msg) => ({
        sender: msg.display_name === currentUser?.name ? "You" : msg.display_name,
        text: msg.body,
        time: new Date(msg.sent_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setSelectedThread(formattedThread);

      requestAnimationFrame(() => {
        scrollThreadToBottom();
      });
    } catch (err) {
      console.error("Error loading thread:", err);
      setSelectedThread([]);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/listing", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load dashboard listings");
      }

      setAllListings(data.listings || []);
    } catch (err) {
      console.error("Error loading dashboard listings:", err);
      setError(err.message || "Something went wrong");
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchListings();
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedMessageId) {
      fetchConversationMessages(selectedMessageId);
    } else {
      setSelectedThread([]);
    }
  }, [selectedMessageId]);

  useEffect(() => {
    if (selectedMessageId && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedMessageId]);

  useEffect(() => {
    if (selectedMessageId && selectedThread.length > 0) {
      requestAnimationFrame(() => {
        scrollThreadToBottom();
      });
    }
  }, [selectedThread, selectedMessageId]);

  const userListings = useMemo(() => {
    return allListings.filter(
      (item) => Number(item.seller_id) === Number(currentUser?.id),
    );
  }, [allListings, currentUser]);

  const activeListings = useMemo(() => {
    return userListings.filter((item) => item.status?.toLowerCase() !== "sold");
  }, [userListings]);

  const soldListings = useMemo(() => {
    return userListings.filter((item) => item.status?.toLowerCase() === "sold");
  }, [userListings]);

  const displayedListings =
    listingTab === "active" ? activeListings : soldListings;

  const stats = useMemo(() => {
    return {
      activeListings: activeListings.length,
      soldItems: soldListings.length,
      unreadMessages: messages.length,
    };
  }, [activeListings, soldListings, messages]);

  const selectedMessage =
    messages.find((message) => message.id === selectedMessageId) || null;

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

  const autoResizeTextarea = (textarea) => {
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${nextHeight}px`;
  };

  const handleMarkSoldClick = (listing) => {
    setListingToMarkSold(listing);
  };

  const handleConfirmMarkSold = async () => {
    if (!listingToMarkSold) return;

    const listingId = listingToMarkSold.listing_id;

    try {
      setAnimatingSoldIds((prev) => [...prev, listingId]);

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
        throw new Error(data.error || "Failed to update listing");
      }

      setAllListings((prev) =>
        prev.map((item) =>
          item.listing_id === listingId ? { ...item, status: "sold" } : item,
        ),
      );

      setListingToMarkSold(null);
    } catch (err) {
      console.error("Mark sold error:", err);
      alert(err.message);
    } finally {
      setAnimatingSoldIds((prev) => prev.filter((id) => id !== listingId));
    }
  };

  const handleDeleteClick = (listing) => {
    setListingToDelete(listing);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;

    const listingId = listingToDelete.listing_id;

    try {
      setAnimatingDeleteIds((prev) => [...prev, listingId]);

      const response = await fetch(`/api/listing/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }

      setAllListings((prev) =>
        prev.filter((item) => item.listing_id !== listingId),
      );

      setListingToDelete(null);
    } catch (err) {
      console.error("Delete listing error:", err);
      alert(err.message);
    } finally {
      setAnimatingDeleteIds((prev) => prev.filter((id) => id !== listingId));
    }
  };

  const handleAcceptOffer = () => {
    if (!offerToAccept) return;

    const offerId = offerToAccept.id;
    setAnimatingAcceptedOfferIds((prev) => [...prev, offerId]);

    setTimeout(() => {
      setVisibleOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      setAnimatingAcceptedOfferIds((prev) =>
        prev.filter((id) => id !== offerId),
      );
      setOfferToAccept(null);
    }, 420);
  };

  const handleDeclineOffer = () => {
    if (!offerToDecline) return;

    const offerId = offerToDecline.id;
    setAnimatingDeclinedOfferIds((prev) => [...prev, offerId]);

    setTimeout(() => {
      setVisibleOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      setAnimatingDeclinedOfferIds((prev) =>
        prev.filter((id) => id !== offerId),
      );
      setOfferToDecline(null);
    }, 420);
  };

  const handleMessageSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!messageDraft.trim() || !selectedMessage) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: selectedMessage.receiverId,
          listing_id: selectedMessage.listingId,
          body: messageDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessageDraft("");

      if (messageInputRef.current) {
        messageInputRef.current.style.height = "0px";
      }

      await fetchConversationMessages(selectedMessage.id);
      await fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!authChecked) {
    return <p>Loading dashboard...</p>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <Navbar
        showSearch={true}
        searchText={dashboardSearchText}
        setSearchText={setDashboardSearchText}
        onSearch={(submittedValue) => {
          navigate(`/?search=${encodeURIComponent(submittedValue)}`);
        }}
        navItems={[
          { to: "/dashboard", label: "Dashboard" },
          { to: "/about", label: "About" },
          { to: "/logout", label: "Logout" },
        ]}
      />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>Dashboard</h1>
            <p className="dashboard-subtext">
              Welcome back, {currentUser.name}. Manage your listings and keep up
              with marketplace activity.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/create-listing")}
            >
              + Create Listing
            </Button>
          </div>
        </div>

        {loading && <p className="dashboard-message">Loading dashboard...</p>}
        {error && <p className="dashboard-message error-message">{error}</p>}

        {!loading && !error && (
          <section className="dashboard-main">
            <div className="dashboard-left-column">
              <section className="overview-section">
                <StatCard
                  label="Active Listings"
                  value={stats.activeListings}
                />
                <StatCard label="Sold Items" value={stats.soldItems} />
              </section>

              <Panel
                className="listings-panel"
                title="My Listings"
                subtitle="Manage your active and sold listings."
                action={
                  <div className="dashboard-tabs">
                    <button
                      className={
                        listingTab === "active"
                          ? "dashboard-tab active"
                          : "dashboard-tab"
                      }
                      onClick={() => setListingTab("active")}
                    >
                      Active
                    </button>

                    <button
                      className={
                        listingTab === "sold"
                          ? "dashboard-tab active"
                          : "dashboard-tab"
                      }
                      onClick={() => setListingTab("sold")}
                    >
                      Sold
                    </button>
                  </div>
                }
                bodyClassName="listings-scroll-body"
              >
                {displayedListings.length === 0 ? (
                  <p className="empty-state">
                    {listingTab === "active"
                      ? `No active listings left for ${currentUser.name}.`
                      : "No sold listings yet."}
                  </p>
                ) : (
                  <div className="listing-list">
                    {displayedListings.map((item) => (
                      <ListingRowCard
                        key={item.listing_id}
                        item={item}
                        isSelling={animatingSoldIds.includes(item.listing_id)}
                        isDeleting={animatingDeleteIds.includes(
                          item.listing_id,
                        )}
                        onRowClick={() =>
                          navigate(`/listing/${item.listing_id}`)
                        }
                        onEdit={() =>
                          navigate(`/edit-listing/${item.listing_id}`)
                        }
                        onMarkSold={() => handleMarkSoldClick(item)}
                        onDelete={() => handleDeleteClick(item)}
                        getStatusLabel={getStatusLabel}
                        getStatusClass={getStatusClass}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="dashboard-side-column">
              <Panel
                className="offers-panel"
                title={`Offers (${visibleOffers.length})`}
                subtitle="Incoming offers on your listings."
                bodyClassName="offers-scroll-body"
              >
                {visibleOffers.length === 0 ? (
                  <p className="empty-state">No pending offers right now.</p>
                ) : (
                  <div className="offers-list">
                    {visibleOffers.map((offer) => {
                      const isAccepting = animatingAcceptedOfferIds.includes(
                        offer.id,
                      );
                      const isDeclining = animatingDeclinedOfferIds.includes(
                        offer.id,
                      );

                      return (
                        <div
                          key={offer.id}
                          className={`offer-card ${
                            isAccepting ? "accepting" : ""
                          } ${isDeclining ? "declining" : ""}`}
                        >
                          <div className="offer-card-top">
                            <div>
                              <h3>{offer.listingTitle}</h3>
                              <p>
                                {offer.buyerName} offered{" "}
                                <strong>${offer.offerAmount.toFixed(2)}</strong>
                              </p>
                            </div>

                            <span className="offer-status">{offer.status}</span>
                          </div>

                          <div className="offer-card-bottom">
                            <span>
                              Listed at ${offer.originalPrice.toFixed(2)} •{" "}
                              {offer.time}
                            </span>

                            <div className="offer-actions">
                              <button
                                type="button"
                                className="offer-decline-btn"
                                onClick={() => setOfferToDecline(offer)}
                              >
                                Decline
                              </button>

                              <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                onClick={() => setOfferToAccept(offer)}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <Panel
                className="messages-panel"
                title={`Messages (${stats.unreadMessages})`}
                subtitle="Recent conversation activity."
                bodyClassName="messages-scroll-body"
              >
                {messages.length === 0 ? (
                  <p className="empty-state">No messages yet.</p>
                ) : (
                  <div className="message-list">
                    {messages.map((message) => (
                      <MessagePreviewCard
                        key={message.id}
                        message={message}
                        isActive={selectedMessageId === message.id}
                        onClick={() => setSelectedMessageId(message.id)}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </section>
        )}
      </div>

      {listingToMarkSold && (
        <div
          className="modal-overlay"
          onClick={() => setListingToMarkSold(null)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Mark Listing as Sold?</h2>
            <p>
              Are you sure you want to mark{" "}
              <strong>{listingToMarkSold.title}</strong> as sold?
            </p>

            <div className="confirm-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setListingToMarkSold(null)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmMarkSold}
              >
                Mark as Sold
              </Button>
            </div>
          </div>
        </div>
      )}

      {listingToDelete && (
        <div className="modal-overlay" onClick={() => setListingToDelete(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Listing?</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{listingToDelete.title}</strong>? This action cannot be
              undone.
            </p>

            <div className="delete-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setListingToDelete(null)}
              >
                Cancel
              </Button>

              <Button
                variant="dangerSolid"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Listing
              </Button>
            </div>
          </div>
        </div>
      )}

      {offerToAccept && (
        <div className="modal-overlay" onClick={() => setOfferToAccept(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Accept Offer?</h2>
            <p>
              Accept <strong>{offerToAccept.buyerName}</strong>'s offer of{" "}
              <strong>${offerToAccept.offerAmount.toFixed(2)}</strong> for{" "}
              <strong>{offerToAccept.listingTitle}</strong>?
            </p>

            <div className="confirm-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOfferToAccept(null)}
              >
                Cancel
              </Button>

              <Button variant="primary" size="sm" onClick={handleAcceptOffer}>
                Accept Offer
              </Button>
            </div>
          </div>
        </div>
      )}

      {offerToDecline && (
        <div className="modal-overlay" onClick={() => setOfferToDecline(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Decline Offer?</h2>
            <p>
              Decline <strong>{offerToDecline.buyerName}</strong>'s offer of{" "}
              <strong>${offerToDecline.offerAmount.toFixed(2)}</strong> for{" "}
              <strong>{offerToDecline.listingTitle}</strong>?
            </p>

            <div className="delete-modal-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOfferToDecline(null)}
              >
                Cancel
              </Button>

              <button
                type="button"
                className="modal-decline-btn"
                onClick={handleDeclineOffer}
              >
                Decline Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div
          className="message-modal-overlay"
          onClick={() => setSelectedMessageId(null)}
        >
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <div className="message-modal-header-text">
                <h2>{selectedMessage.name}</h2>
                <p>About: {selectedMessage.listingTitle}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMessageId(null)}
              >
                Close
              </Button>
            </div>

            <div className="message-modal-thread" ref={messageThreadRef}>
              {selectedThread.map((msg, index) => {
                const isCurrentUser = msg.sender === "You";

                return (
                  <div
                    key={index}
                    className={
                      isCurrentUser
                        ? "conversation-message own"
                        : "conversation-message"
                    }
                  >
                    <div className="conversation-message-content">
                      <div className="conversation-sender">{msg.sender}</div>

                      <div className="conversation-bubble">
                        <p>{msg.text}</p>
                      </div>

                      <div className="conversation-time">{msg.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              className="message-modal-input-row"
              onSubmit={handleMessageSubmit}
            >
              <div className="conversation-input-shell">
                <textarea
                  ref={messageInputRef}
                  className="conversation-textarea"
                  placeholder="Type your message..."
                  value={messageDraft}
                  rows={1}
                  onChange={(e) => {
                    setMessageDraft(e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleMessageSubmit(e);
                    }
                  }}
                />
              </div>

              <Button variant="primary" size="sm" type="submit">
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}