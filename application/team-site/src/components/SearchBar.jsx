import "./SearchBar.css";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search Marketplace",
}) {
  return (
    <form
      className="shared-search"
      onSubmit={(e) => {
        e.preventDefault();

        const trimmed = value.trim();

        if (!trimmed) {
          onSubmit("");
          return;
        }

        if (trimmed.length > 100) return;

        onSubmit(trimmed);
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        className="shared-search__input"
        value={value}
        maxLength={100}
        onChange={(e) => onChange(e.target.value)}
      />

      <button type="submit" className="shared-search__icon">
        <i className="bi bi-search"></i>
      </button>
    </form>
  );
}