import "./PriceFilter.css";
import Button from "./Button";

export default function PriceFilter({
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    onApplyPrice
}) {
    return (
    <div className="price-sidebar">
        <div className="price-filter">
            <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            />

            <span className="price-dash">-</span>

            <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            />
        </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onApplyPrice}
            >
            Set Price Range
            </Button>
    </div> 
    )
}