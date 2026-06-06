import { useEffect, useState } from "react";

export default function VP() {
  const [category, setCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/search?category=${encodeURIComponent(
          category
        )}&searchText=${encodeURIComponent(searchText)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        SFSU Software Engineering Project CSC 648-848, Spring 2026 – Team 04
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Textbooks">Textbooks</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <button type="submit">Search</button>
      </form>

      <p style={{ textAlign: "center", marginBottom: "25px" }}>
        {count} items found
      </p>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {results.map((item) => (
          <div
            key={item.listing_id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "20px",
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
              backgroundColor: "#fff",
            }}
          >
            <div
              style={{
                width: "220px",
                height: "160px",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.innerHTML =
                      "<span style='color:#666;font-size:14px;'>No image available</span>";
                  }}
                />
              ) : (
                <span style={{ color: "#666", fontSize: "14px" }}>
                  No image available
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ marginTop: 0, marginBottom: "10px" }}>{item.title}</h2>
              <p style={{ margin: "6px 0" }}>
                <strong>Category:</strong> {item.category_name}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Price:</strong> ${Number(item.price).toFixed(2)}
              </p>
              <p style={{ margin: "10px 0 0 0" }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}