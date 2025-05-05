const conf = {
    appwriteUrl: String(import.meta.env.VITE_APPWRITE_URL),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteCourseCollectionId: String(import.meta.env.VITE_APPWRITE_COURSE_COLLECTION_ID),
    appwriteCollectionId: String(import.meta.env.VITE_APPWRITE_POST_COLLECTION_ID), // Add for consistency
    appwriteCourseCollectionId: String(import.meta.env.VITE_APPWRITE_COURSE_COLLECTION_ID),
    appwriteCourseCollectionId: String(import.meta.env.VITE_APPWRITE_COURSE_COLLECTION_ID), // Update to match config.js
    appwriteCoursesCollectionId: String(import.meta.env.VITE_APPWRITE_COURSE_COLLECTION_ID), // Add for consistency
    appwriteRatingCollectionId: String(import.meta.env.VITE_APPWRITE_RATING_COLLECTION_ID), // Original
    appwriteRatingsCollectionId: String(import.meta.env.VITE_APPWRITE_RATING_COLLECTION_ID), // Add for consistency
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
}

export default conf