import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import service from "../appwrite/config";
import conf from "../conf/conf.js";

function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const availableSections = ["sql", "java", "javascript", "c++", "python", "html", "css", "DSA"];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log("Fetching courses...");
      const response = await service.getCourses();
      console.log("Courses response:", response);
      
      if (response && response.documents) {
        setCourses(response.documents);
        console.log("Courses set:", response.documents);
      } else {
        console.log("No courses returned from service or empty documents array");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setUploadStatus(`Error fetching courses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setVideo(event.target.files[0]);
  };

  const handleSectionChange = (e) => {
    const section = e.target.value;
    if (section && !sections.includes(section)) {
      setSections([...sections, section]);
    }
  };

  const removeSection = (sectionToRemove) => {
    setSections(sections.filter(section => section !== sectionToRemove));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title || sections.length === 0) {
      setUploadStatus("Please provide a title and at least one section");
      return;
    }

    try {
      setLoading(true);
      setUploadStatus("Creating course...");
      
      const result = await service.createCourse({
        title,
        description,
        sections
      });
      
      if (result) {
        setUploadStatus("Course created successfully!");
        setTitle("");
        setDescription("");
        setSections([]);
        fetchCourses(); // Refresh the courses list
      } else {
        setUploadStatus("Failed to create course. Check console for details.");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      setUploadStatus(`Error creating course: ${error.message}`);
    } finally {
      setLoading(false);
      setIsAddingCourse(false);
    }
  };

  const handleUpload = async () => {
    if (!video) {
      setUploadStatus("Please select a video file to upload.");
      return;
    }

    if (!selectedCourse) {
      setUploadStatus("Please select a course for this video.");
      return;
    }

    setLoading(true);
    setUploadStatus("Uploading video...");
    
    try {
      // Upload the video file
      const fileResponse = await service.uploadFile(video);
      console.log("File upload response:", fileResponse);
      
      if (fileResponse && fileResponse.$id) {
        setUploadStatus("Video uploaded, adding to course...");
        
        // Add the video to the selected course
        const courseResponse = await service.addVideoToCourse(selectedCourse, fileResponse.$id);
        console.log("Course update response:", courseResponse);
        
        if (courseResponse) {
          setUploadStatus("Upload successful! Video added to course.");
          setVideo(null);
          setSelectedCourse("");
          // Reset the file input
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = "";
        } else {
          setUploadStatus("Error adding video to course. Check console for details.");
        }
      } else {
        setUploadStatus("Error uploading file. Check console for details.");
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Course Management</h2>
      <Link to="/courses" style={{ marginBottom: "20px", display: "block" }}>
        View All Courses
      </Link>

      {/* Toggle between adding course and uploading video */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={() => setIsAddingCourse(false)}
          style={{ 
            marginRight: "10px", 
            fontWeight: !isAddingCourse ? 'bold' : 'normal',
            padding: "8px 16px",
            backgroundColor: !isAddingCourse ? '#4CAF50' : '#f1f1f1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={loading}
        >
          Upload Video
        </button>
        <button 
          onClick={() => setIsAddingCourse(true)}
          style={{ 
            fontWeight: isAddingCourse ? 'bold' : 'normal',
            padding: "8px 16px",
            backgroundColor: isAddingCourse ? '#4CAF50' : '#f1f1f1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={loading}
        >
          Add New Course
        </button>
      </div>

      {isAddingCourse ? (
        <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
          <h3>Add New Course</h3>
          <form onSubmit={handleCreateCourse}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Course Title:</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
                required
                disabled={loading}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Description:</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px", minHeight: "100px" }}
                disabled={loading}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Add Sections:</label>
              <select 
                onChange={handleSectionChange}
                style={{ padding: "8px", marginRight: "10px" }}
                disabled={loading}
              >
                <option value="">Select a section</option>
                {availableSections.map(section => (
                  <option key={section} value={section}>{section.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label>Selected Sections:</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
                {sections.map(section => (
                  <div key={section} style={{ 
                    background: "#f0f0f0", 
                    padding: "5px 10px", 
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {section.toUpperCase()}
                    <button 
                      type="button"
                      onClick={() => removeSection(section)}
                      style={{ marginLeft: "5px", border: "none", background: "none", cursor: "pointer" }}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              type="submit" 
              style={{ 
                padding: "10px 20px", 
                background: "#4CAF50", 
                color: "white", 
                border: "none", 
                borderRadius: "4px", 
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
          <h3>Upload a Video</h3>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Select Course:</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              disabled={loading}
            >
              <option value="">Select a course {courses.length === 0 ? "(No courses available)" : ""}</option>
              {courses.length > 0 ? (
                courses.map(course => (
                  <option key={course.$id} value={course.$id}>{course.title}</option>
                ))
              ) : (
                <option disabled>No courses found. Please create a course first.</option>
              )}
            </select>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Select Video File:</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange} 
              style={{ width: "100%" }}
              disabled={loading}
            />
          </div>
          
          <button 
            onClick={handleUpload} 
            style={{ padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Upload Video to Course
          </button>
        </div>
      )}
      
      {uploadStatus && (
        <div style={{ 
          marginTop: "20px", 
          padding: "10px", 
          background: uploadStatus.includes("Error") ? "#ffebee" : "#e8f5e9",
          borderRadius: "4px"
        }}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

export default VideoUpload;
