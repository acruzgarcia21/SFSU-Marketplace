import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PriceFilter from "../components/PriceFilter";
import Navbar from "../components/Navbar";
import "../styles/home.css";

export default function Home() {
  const [searchParams] = useSearchParams();

  const categories = [
    "All",
    "Textbooks",
    "Electronics",
    "Furniture",
    "Apparel",
    "Entertainment",
    "Free Stuff",
  ];

  const [hasSearched, setHasSearched] = useState(false);
  const [category, setCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [count, setCount] = useState(0);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fallback, setFallback] = useState(false);

  const getListingImageSrc = (image) => {
    if (!image) return "";
    if (image.startsWith("/images/")) return image;
    if (image.startsWith("http")) return image;
    return `/api/listing/image/${image}`;
  };

  const handleSearch = async (
    selectedCategory = category,
    enteredSearchText = searchText,
    enteredMinPrice = minPrice,
    enteredMaxPrice = maxPrice,
  ) => {
    try {
      setLoading(true);
      setError("");

      const trimmedSearchText = enteredSearchText.trim().slice(0, 100);
      const trimmedMinPrice = enteredMinPrice.trim();
      const trimmedMaxPrice = enteredMaxPrice.trim();

      const isDefault =
        selectedCategory === "All" &&
        trimmedSearchText === "" &&
        trimmedMinPrice === "" &&
        trimmedMaxPrice === "";

      setHasSearched(!isDefault);
      setAppliedSearchText(trimmedSearchText);
      setAppliedMinPrice(trimmedMinPrice);
      setAppliedMaxPrice(trimmedMaxPrice);

      const response = await fetch(
        `/api/search?category=${encodeURIComponent(
          selectedCategory,
        )}&searchText=${encodeURIComponent(
          trimmedSearchText,
        )}&minPrice=${encodeURIComponent(
          trimmedMinPrice,
        )}&maxPrice=${encodeURIComponent(trimmedMaxPrice)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (data.count === 0 && !isDefault) {
        setFallback(true);

        const fallbackResponse = await fetch("/api/search?category=All");
        const fallbackData = await fallbackResponse.json();
        
        setListings(fallbackData.results || []);
        setCount(0);
      } else {
        setFallback(false);
        setListings(data.results || []);
        setCount(data.count || 0);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
      setListings([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = async () => {
    setCategory("All");

    setSearchText("");
    setMinPrice("");
    setMaxPrice("");

    setAppliedSearchText("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");

    setHasSearched(false);
    setFallback(false);

    await handleSearch("All","","","");
  }

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
      case "price-asc":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-desc":
        return parseFloat(b.price) - parseFloat(a.price);
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      default:
        return 0;
    }
  });

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";

    setSearchText(urlSearch);
    setCategory("All");

    handleSearch("All", urlSearch);
  }, [searchParams]);

  return (
    <>
      <Navbar
        searchText={searchText}
        setSearchText={setSearchText}
        onSearch={(submittedValue) => handleSearch(category, submittedValue)}
        showSearch={true}
        authMode="guest"
        onLogoClick={resetSearch}
      />

      <div className="home-container">
        <p className="tagline">Marketplace for SFSU Students</p>

        <div className="main-content">
          <button className="mobile-filter-toggle"
            onClick={() => setFiltersOpen(!filtersOpen)}>
              ☰ Filters
          </button>
          <div className={`sidebar-column ${filtersOpen ? "open" : ""}`}>
            <div className="category-sidebar">
              <h3>Categories</h3>
              <ul>
                {categories.map((cat, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setCategory(cat);
                      setSortOption("default");
                      handleSearch(cat, searchText, minPrice, maxPrice);
                    }}
                    className={
                      category === cat ? "category-item active" : "category-item"
                    }
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>

            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              onApplyPrice={() => {
                handleSearch(category, searchText, minPrice, maxPrice);
              }}
            />
          </div>

          <div className="listings-section">
            <div className="listings-header">
              <h2>
                {loading
                  ? "Loading..."
                  : hasSearched
                    ? appliedSearchText
                        ? fallback
                          ? `No results found for "${appliedSearchText}" - Check out our featured listings below`
                          : `Results for "${appliedSearchText}" – ${count} ${
                          count === 1 ? "Item" : "Items"
                        } Found`
                      : `${category}`
                    : "Featured Listings"}
              </h2>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="sort-select"
              >
                <option value="default">Sort By</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {loading && <p>Loading listings...</p>}
            {error && <p>{error}</p>}

            <div className="listings-grid">
              {!loading &&
                !error &&
                sortedListings.map((item) => (
                  <Link
                    to={`/listing/${item.listing_id}`}
                    key={item.listing_id}
                    className="listing-card"
                  >
                    <div className="listing-image">
                      {item.image ? (
                        <img
                          src={getListingImageSrc(item.image)}
                          alt={item.title}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        "No Image"
                      )}
                    </div>

                    <h3>{item.title}</h3>

                    <p className="listing-price">
                      {Number(item.price) === 0
                        ? "Free"
                        : `$${Number(item.price).toFixed(2)}`}
                    </p>

                    <p className="seller-name">
                      {item.seller_name || "Seller Name"}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}