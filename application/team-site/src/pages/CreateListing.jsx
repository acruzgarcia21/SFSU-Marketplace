import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/create-listing.css";

export default function CreateListing() {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    condition: "",
    courseTag: "",
    pickupLocation: "",
    description: "",
  });

  const [isFree, setIsFree] = useState(false);
  const [images, setImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFreeToggle = (e) => {
    const checked = e.target.checked;

    setIsFree(checked);

    setFormData((prev) => ({
      ...prev,
      price: checked ? "0" : "",
    }));
  };

  const handleImageUpload = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setImages((prev) => {
      const updatedImages = [...prev, ...selectedFiles].slice(0, 6);

      if (prev.length === 0 && updatedImages.length > 0) {
        setPreviewIndex(0);
      }

      return updatedImages;
    });

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));

    setPreviewIndex((prev) => {
      if (indexToRemove === prev) return 0;
      if (indexToRemove < prev) return prev - 1;
      return prev;
    });
  };

  const handleThumbnailClick = (index) => {
    setPreviewIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!storedUser?.user_id) {
      navigate("/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const listingResponse = await fetch("/api/listing", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: isFree ? 0 : Number(formData.price),
          category_name: formData.category,
          course_tag: formData.courseTag || null,
          pickup_location: formData.pickupLocation,
          item_condition: formData.condition,
        }),
      });

      const listingData = await listingResponse.json();

      if (!listingResponse.ok) {
        throw new Error(listingData.error || "Failed to create listing");
      }

      const listingId = listingData.listing.listing_id;

      if (images.length > 0) {
        const imageFormData = new FormData();

        const selectedMainImage = images[previewIndex];

        const orderedImages = selectedMainImage
          ? [
              selectedMainImage,
              ...images.filter((_, index) => index !== previewIndex),
            ]
          : images;

        orderedImages.forEach((image) => {
          imageFormData.append("images", image);
        });

        const imageResponse = await fetch(`/api/listing/${listingId}/images`, {
          method: "POST",
          credentials: "include",
          body: imageFormData,
        });

        const imageData = await imageResponse.json();

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message || "Listing created, but image upload failed",
          );
        }
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (err) {
      console.error("Create listing error:", err);
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  const mainImage = imagePreviews[previewIndex]?.url;

  return (
    <div className="create-listing-page">
      <Navbar
        showSearch={true}
        searchText={searchText}
        setSearchText={setSearchText}
        onSearch={(submittedValue) => {
          navigate(`/?search=${encodeURIComponent(submittedValue)}`);
        }}
        navItems={[
          { to: "/dashboard", label: "Dashboard" },
          { to: "/about", label: "About" },
          { to: "/logout", label: "Logout" },
        ]}
      />

      <div className="create-listing-container">
        <div className="create-listing-header">
          <h1>Create Listing</h1>
          <p>Add photos and details to post your item to the marketplace.</p>
        </div>

        <form className="create-listing-form" onSubmit={handleSubmit}>
          <div className="create-listing-left">
            <div className="create-panel">
              <div className="section-header photos-header">
                <h2>Photos</h2>

                <span
                  className={`image-counter ${
                    images.length === 6 ? "full" : ""
                  }`}
                >
                  {images.length}/6 used
                </span>
              </div>

              <p className="photos-subtext">
                Upload up to 6 images. Click a thumbnail to set it as the main
                image.
              </p>

              <label htmlFor="listing-images" className="upload-box">
                <div className="upload-box-content">
                  <i className="bi bi-images"></i>
                  <h3>Upload Listing Images</h3>
                  <p>Click to add one or more photos</p>
                </div>
              </label>

              <input
                id="listing-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden-file-input"
              />

              <div
                className={`main-preview-box ${mainImage ? "has-image" : ""}`}
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt="Image preview"
                    className="main-preview-image"
                  />
                ) : (
                  <div className="main-preview-placeholder">
                    First uploaded image will appear here
                  </div>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="thumbnail-row">
                  {imagePreviews.map((image, index) => (
                    <div
                      key={`${image.file.name}-${index}`}
                      className={`thumbnail-wrapper ${
                        index === previewIndex ? "active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="thumbnail-button"
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className="thumbnail-image"
                        />
                      </button>

                      {index === previewIndex && (
                        <span className="main-image-pill">Main</span>
                      )}

                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)}
                        aria-label="Remove image"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="create-listing-right">
            <div className="create-panel">
              <div className="section-header details-header">
                <h2>Listing Details</h2>
                <p>Fill out the item information below.</p>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="title">
                    Title <span className="required-star">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: CSC 648 Textbook"
                    required
                  />
                </div>

                <div className="form-group price-group">
                  <div className="price-label-row">
                    <label htmlFor="price">
                      Price <span className="required-star">*</span>
                    </label>

                    <label className="free-toggle-row">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={handleFreeToggle}
                      />
                      <span>Mark as Free</span>
                    </label>
                  </div>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={isFree ? "0" : formData.price}
                    onChange={handleChange}
                    placeholder={isFree ? "Free" : "0.00"}
                    disabled={isFree}
                    required
                  />

                  {isFree && (
                    <p className="free-listing-note">
                      This listing will be shown as Free.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Textbooks">Textbooks</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Free Stuff">Free Stuff</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="condition">
                    Condition <span className="required-star">*</span>
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select condition</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Used">Used</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="courseTag">Course Tag</label>
                  <input
                    id="courseTag"
                    name="courseTag"
                    type="text"
                    value={formData.courseTag}
                    onChange={handleChange}
                    placeholder="Ex: CSC 648"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="pickupLocation">
                    Pickup Location <span className="required-star">*</span>
                  </label>
                  <input
                    id="pickupLocation"
                    name="pickupLocation"
                    type="text"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    placeholder="Ex: Cesar Chavez Student Center"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">
                    Description <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="6"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the item, condition, and anything important buyers should know..."
                    required
                  ></textarea>
                </div>
              </div>

              <div className="create-listing-actions">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" type="button">
                    Cancel
                  </Button>
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post Listing"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className="listing-success-overlay">
          <div className="listing-success-modal">
            <div className="success-checkmark">
              <i className="bi bi-check-lg"></i>
            </div>

            <h2>Listing Posted!</h2>

            <p>Your listing has been successfully submitted.</p>
          </div>
        </div>
      )}
    </div>
  );
}

