import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import service from "../appwrite/config";
import conf from "../conf/conf";
import { Query, ID } from "appwrite";

function AllCourses({ userId }) {
  const [courses, setCourses] = useState([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [reviewText, setReviewText] = useState("");
  const [selectedCourseForReview, setSelectedCourseForReview] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch courses from database
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const queries =
        selectedSection !== "all"
          ? [Query.equal("sections", [selectedSection])]
          : [];

      const response = await service.getCourses(queries);
      if (response) {
        setCourses(response.documents);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user ratings
  const fetchUserRatings = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log("Fetching user ratings for user:", userId);
      console.log("Using collection ID:", conf.appwriteRatingCollectionId);
      
      const response = await service.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteRatingCollectionId,
        [Query.equal('userId', userId)]
      );
      
      console.log("User ratings response:", response);
      
      if (response && response.documents) {
        const ratingsMap = response.documents.reduce((acc, rating) => {
          acc[`${rating.courseId}-${rating.section}`] = rating.rating;
          return acc;
        }, {});
        console.log("Processed ratings map:", ratingsMap);
        setUserRatings(ratingsMap);
      } else {
        console.log("No ratings found or empty response");
        setUserRatings({});
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
      setUserRatings({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews for all courses
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const allReviews = {};
      for (const course of courses) {
        const response = await service.getReviews(course.$id);
        if (response) {
          allReviews[course.$id] = response.documents;
        }
      }
      setReviews(allReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedSection]);

  useEffect(() => {
    if (userId) {
      fetchUserRatings();
    }
  }, [userId]);

  useEffect(() => {
    if (courses.length > 0) {
      fetchReviews();
    }
  }, [courses]);

  const handleRating = async (courseId, section, newRating) => {
    if (!userId) return;

    try {
      setLoading(true);
      // Get existing review text if any
      let existingComment = "";
      
      try {
        const existingReviews = await service.databases.listDocuments(
          conf.appwriteDatabaseId,
          conf.appwriteRatingCollectionId,
          [
            Query.equal('courseId', courseId),
            Query.equal('userId', userId),
            Query.equal('section', section)
          ]
        );
        
        if (existingReviews.documents.length > 0) {
          existingComment = existingReviews.documents[0].comment || "";
        }
      } catch (error) {
        console.error("Error fetching existing review:", error);
        // Continue with empty comment if there's an error
      }
      
      console.log("Adding review with rating:", newRating, "comment:", existingComment);
      
      // Use direct database operations if service.addReview is not working
      try {
        const existingReviews = await service.databases.listDocuments(
          conf.appwriteDatabaseId,
          conf.appwriteRatingCollectionId,
          [
            Query.equal('courseId', courseId),
            Query.equal('userId', userId),
            Query.equal('section', section)
          ]
        );
        
        if (existingReviews.documents.length > 0) {
          // Update existing review
          await service.databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteRatingCollectionId,
            existingReviews.documents[0].$id,
            { rating: newRating, comment: existingComment }
          );
        } else {
          // Create new review
          await service.databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteRatingCollectionId,
            ID.unique(),
            {
              userId,
              courseId,
              section,
              rating: newRating,
              comment: existingComment
            }
          );
        }
        
        // Update local state
        setUserRatings(prev => ({
          ...prev,
          [`${courseId}-${section}`]: newRating
        }));
        
        // Refresh course data and reviews
        fetchCourses();
        fetchReviews();
        
      } catch (error) {
        console.error("Error saving rating:", error);
        alert("Failed to save your rating. Please try again.");
      }
    } catch (error) {
      console.error('Error in rating process:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userId || !selectedCourseForReview || !reviewText) return;

    try {
      setLoading(true);
      const currentRating = userRatings[`${selectedCourseForReview.courseId}-${selectedCourseForReview.section}`] || 5;
      
      await addReview(
        selectedCourseForReview.courseId,
        userId,
        selectedCourseForReview.section,
        currentRating,
        reviewText
      );

      setReviewText("");
      setSelectedCourseForReview(null);
      fetchReviews();
      alert("Your review has been submitted successfully!");
    } catch (error) {
      console.error('Error submitting review:', error);
      alert("Failed to submit your review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (courseId, userId, section, rating, comment = "") => {
    try {
      console.log("Adding review:", { courseId, userId, section, rating, comment });
      
      // Check if review exists
      const existingReviews = await service.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteRatingCollectionId,
        [
          Query.equal('courseId', courseId),
          Query.equal('userId', userId),
          Query.equal('section', section)
        ]
      );

      let response;
      if (existingReviews.documents.length > 0) {
        // Update existing review
        response = await service.databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwriteRatingCollectionId,
          existingReviews.documents[0].$id,
          { rating, comment }
        );
      } else {
        // Create new review
        response = await service.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteRatingCollectionId,
          ID.unique(),
          {
            userId,
            courseId,
            section,
            rating,
            comment
          }
        );
      }
      
      return response;
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  };

  // Debug function to check if the button click is working
  const handleReviewButtonClick = (courseId, section) => {
    console.log("Review button clicked for:", courseId, "section:", section);
    setSelectedCourseForReview({
      courseId: courseId,
      section: section,
    });
    console.log("selectedCourseForReview set to:", {
      courseId: courseId,
      section: section,
    });
  };

  // Video handling functions
  const handleThumbnailClick = (file) => setSelectedVideo(file);
  const closeVideoPlayer = () => setSelectedVideo(null);

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Courses</h2>
      <Link to="/add-videos">Back to Upload Page</Link>

      {/* Section Filter */}
      <div style={{ margin: "20px 0" }}>
        <button
          onClick={() => setSelectedSection("all")}
          style={{
            fontWeight: selectedSection === "all" ? "bold" : "normal",
            margin: "0 10px",
            padding: "8px 16px",
            backgroundColor: selectedSection === "all" ? "#4CAF50" : "#f1f1f1",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          All Sections
        </button>
        {["sql", "java", "javascript", "c++", "DSA"].map((section) => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            style={{
              margin: "0 10px",
              padding: "8px 16px",
              backgroundColor:
                selectedSection === section ? "#4CAF50" : "#f1f1f1",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: selectedSection === section ? "bold" : "normal",
            }}
          >
            {section.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {courses.map((course) => (
          <div
            key={course.$id}
            style={{
              width: "300px",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p>Sections: {course.sections.join(", ")}</p>

            {/* Video Thumbnail */}
            {course.fileId && (
              <video
                width="100%"
                height="150"
                controls={false}
                onClick={() => handleThumbnailClick({ $id: course.fileId })}
                style={{ cursor: "pointer", borderRadius: "4px" }}
                src={`${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${course.fileId}/view?project=${conf.appwriteProjectId}`}
              />
            )}

            {/* Rating Section */}
            <div
              style={{
                marginTop: "15px",
                borderTop: "1px solid #eee",
                paddingTop: "10px",
              }}
            >
              <h4>Rate this course:</h4>
              <div style={{ display: "flex", gap: "5px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      handleRating(
                        course.$id,
                        selectedSection === "all" ? "general" : selectedSection,
                        star
                      )
                    }
                    style={{
                      cursor: "pointer",
                      color:
                        star <=
                        (userRatings[
                          `${course.$id}-${
                            selectedSection === "all"
                              ? "general"
                              : selectedSection
                          }`
                        ] || 0)
                          ? "#ffd700"
                          : "#ddd",
                      background: "none",
                      border: "none",
                      fontSize: "1.5rem",
                    }}
                    disabled={!userId || loading}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p>
                Average Rating:{" "}
                {course.averageRatings?.[
                  selectedSection === "all" ? "general" : selectedSection
                ]?.toFixed(1) || "N/A"}
              </p>

              {/* Add Review Button */}
              <button
                onClick={() =>
                  handleReviewButtonClick(
                    course.$id,
                    selectedSection === "all" ? "general" : selectedSection
                  )
                }
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
                disabled={!userId || loading}
              >
                Add Review
              </button>

              {/* Display Reviews */}
              {reviews[course.$id] && reviews[course.$id].length > 0 && (
                <div style={{ marginTop: "15px" }}>
                  <h4>Reviews:</h4>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {reviews[course.$id]
                      .filter(
                        (review) =>
                          review.section ===
                          (selectedSection === "all"
                            ? "general"
                            : selectedSection)
                      )
                      .map((review, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom: "10px",
                            padding: "5px",
                            backgroundColor: "#f9f9f9",
                            borderRadius: "4px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "3px" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                style={{
                                  color:
                                    star <= review.rating ? "#ffd700" : "#ddd",
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {review.comment && (
                            <p style={{ margin: "5px 0" }}>{review.comment}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeVideoPlayer}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <video
              width="720"
              height="480"
              controls
              autoPlay
              src={`${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${selectedVideo.$id}/view?project=${conf.appwriteProjectId}`}
            >
              Your browser does not support the video tag.
            </video>
            <button
              onClick={closeVideoPlayer}
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                backgroundColor: "#fff",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "16px",
                borderRadius: "50%",
              }}
            >
              X
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedCourseForReview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedCourseForReview(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>Write a Review</h3>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{
                width: "100%",
                height: "100px",
                marginBottom: "15px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
              placeholder="Write your review here..."
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setSelectedCourseForReview(null)}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllCourses;
