import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import "../styles/edit-listing.css";

export default function EditListing() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [searchText, setSearchText] = useState("");

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    condition: "",
    courseTag: "",
    pickupLocation: "",
    description: "",
  });

  const [originalFormData, setOriginalFormData] = useState(null);
  const [originalImageNames, setOriginalImageNames] = useState([]);

  const [isFree, setIsFree] = useState(false);

  const [images, setImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getListingImageSrc = (image) => {
    if (!image) return "";
    if (image.startsWith("/images/")) return image;
    if (image.startsWith("http")) return image;
    return `/api/listing/image/${image}`;
  };

  const normalizeFormData = (data, freeValue = false) => ({
    title: data.title.trim(),
    price: freeValue ? 0 : Number(data.price),
    category: data.category,
    condition: data.condition,
    courseTag: data.courseTag.trim(),
    pickupLocation: data.pickupLocation.trim(),
    description: data.description.trim(),
  });

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
        setListing(loadedListing);

        const loadedFormData = {
          title: loadedListing?.title || "",
          price: loadedListing?.price || "",
          category: loadedListing?.category_name || "",
          condition: loadedListing?.item_condition || "Like New",
          courseTag: loadedListing?.course_tag || "",
          pickupLocation: loadedListing?.pickup_location || "",
          description: loadedListing?.description || "",
        };

        setFormData(loadedFormData);
        setOriginalFormData(loadedFormData);

        setIsFree(Number(loadedListing?.price) === 0);

        let existingImages = [];

        if (loadedListing?.listing_id) {
          const imagesResponse = await fetch(
            `/api/listing/${loadedListing.listing_id}/images`,
          );

          const imagesData = await imagesResponse.json();

          if (imagesResponse.ok && Array.isArray(imagesData.images)) {
            existingImages = imagesData.images.map((imageName, index) => ({
              name: imageName,
              url: getListingImageSrc(imageName),
              existing: true,
              imageOrder: index + 1,
            }));
          }
        }

        setImages(existingImages);
        setOriginalImageNames(existingImages.map((image) => image.name));
        setImagesToDelete([]);
        setPreviewIndex(0);
      } catch (err) {
        console.error("Error loading listing for edit:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const imagePreviews = useMemo(() => {
    return images.map((image) => {
      if (image.existing) return image;

      return {
        ...image,
        url: URL.createObjectURL(image.file),
      };
    });
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => {
        if (!image.existing && image.url) {
          URL.revokeObjectURL(image.url);
        }
      });
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

    const newImages = selectedFiles.map((file) => ({
      name: file.name,
      file,
      existing: false,
    }));

    setImages((prev) => {
      const updatedImages = [...prev, ...newImages].slice(0, 6);

      if (prev.length === 0 && updatedImages.length > 0) {
        setPreviewIndex(0);
      }

      return updatedImages;
    });

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => {
      const imageToRemove = prev[indexToRemove];

      if (imageToRemove?.existing) {
        setImagesToDelete((prevDelete) => [...prevDelete, imageToRemove.name]);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });

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

    const confirmSave = window.confirm(
      "Save changes? Removed photos will be permanently deleted.",
    );

    if (!confirmSave) return;

    const currentNormalizedForm = normalizeFormData(formData, isFree);
    const originalNormalizedForm = originalFormData
      ? normalizeFormData(
          originalFormData,
          Number(originalFormData.price) === 0,
        )
      : null;

    const textChanged =
      !originalNormalizedForm ||
      JSON.stringify(currentNormalizedForm) !==
        JSON.stringify(originalNormalizedForm);

    const currentImageNames = images.map((image) => image.name);
    const imageListChanged =
      JSON.stringify(currentImageNames) !== JSON.stringify(originalImageNames);

    const hasNewImages = images.some((image) => !image.existing);
    const mainImageChanged = previewIndex !== 0;

    const imagesChanged = imageListChanged || hasNewImages || mainImageChanged;

    if (!textChanged && !imagesChanged) {
      alert("No changes to save.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (textChanged) {
        const updateResponse = await fetch(`/api/listing/${id}`, {
          method: "PUT",
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
        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          throw new Error(updateData.error || "Failed to update listing");
        }
      }

      if (imagesChanged) {
        const imageFormData = new FormData();
        const newImages = images.filter((image) => !image.existing);

        newImages.forEach((image) => {
          imageFormData.append("images", image.file);
        });

        const selectedMainImage = images[previewIndex];

        const orderedImages = selectedMainImage
          ? [
              selectedMainImage,
              ...images.filter((_, index) => index !== previewIndex),
            ]
          : [];

        const imageOrder = orderedImages.map((image) => {
          if (image.existing) {
            return {
              type: "existing",
              name: image.name,
            };
          }

          const fileIndex = newImages.findIndex(
            (newImage) => newImage === image,
          );

          return {
            type: "new",
            fileIndex,
          };
        });

        imageFormData.append("imageOrder", JSON.stringify(imageOrder));

        const imageResponse = await fetch(`/api/listing/${id}/images`, {
          method: "POST",
          credentials: "include",
          body: imageFormData,
        });

        const imageData = await imageResponse.json();

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message || "Listing updated, but image update failed",
          );
        }
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (err) {
      console.error("Edit listing error:", err);
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  const mainImage = imagePreviews[previewIndex]?.url;

  if (loading) {
    return <div className="edit-page-message">Loading listing...</div>;
  }

  if (error) {
    return <div className="edit-page-message error-message">{error}</div>;
  }

  if (!listing) {
    return <div className="edit-page-message">Listing not found.</div>;
  }

  return (
    <div className="edit-listing-page">
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

      <div className="edit-listing-container">
        <div className="edit-listing-header">
          <h1>Edit Listing</h1>
          <p>Update your listing details, images, and item information.</p>
        </div>

        <form className="edit-listing-form" onSubmit={handleSubmit}>
          <div className="edit-listing-left">
            <div className="edit-panel">
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

              <label htmlFor="edit-listing-images" className="upload-box">
                <div className="upload-box-content">
                  <i className="bi bi-images"></i>
                  <h3>Upload Listing Images</h3>
                  <p>Click to replace or add more photos</p>
                </div>
              </label>

              <input
                id="edit-listing-images"
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
                    Listing image preview
                  </div>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="thumbnail-row">
                  {imagePreviews.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
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

          <div className="edit-listing-right">
            <div className="edit-panel">
              <div className="section-header details-header">
                <h2>Listing Details</h2>
                <p>Update the item information below.</p>
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

              <div className="edit-listing-actions">
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
                  {isSubmitting ? "Saving..." : "Save Changes"}
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

            <h2>Listing Updated!</h2>

            <p>Your listing changes have been successfully saved.</p>
          </div>
        </div>
      )}
    </div>
  );
}

