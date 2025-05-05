import conf from '../conf/conf.js';
import { Client, ID, Databases, Storage, Query } from "appwrite";

export class Service{
    client = new Client();
    databases;
    bucket;
    
    constructor(){
        this.client
        .setEndpoint(conf.appwriteUrl)
        .setProject(conf.appwriteProjectId);
        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
        
        // Log configuration to help debug
        console.log("Appwrite Configuration:", {
            endpoint: conf.appwriteUrl,
            projectId: conf.appwriteProjectId,
            databaseId: conf.appwriteDatabaseId,
            coursesCollectionId: conf.appwriteCourseCollectionId || conf.appwriteCoursesCollectionId,
            bucketId: conf.appwriteBucketId
        });
    }

    async createPost({title, slug, content, featuredImage, status, userId}){
        try {
            return await this.databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
                    title,
                    content,
                    featuredImage,
                    status,
                    userId,
                }
            )
        } catch (error) {
            console.log("Appwrite serive :: createPost :: error", error);
        }
    }

    async updatePost(slug, {title, content, featuredImage, status}){
        try {
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
                    title,
                    content,
                    featuredImage,
                    status,

                }
            )
        } catch (error) {
            console.log("Appwrite serive :: updatePost :: error", error);
        }
    }

    async deletePost(slug){
        try {
            await this.databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            
            )
            return true
        } catch (error) {
            console.log("Appwrite serive :: deletePost :: error", error);
            return false
        }
    }

    async getPost(slug){
        try {
            return await this.databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            
            )
        } catch (error) {
            console.log("Appwrite serive :: getPost :: error", error);
            return false
        }
    }

    async getPosts(queries = [Query.equal("status", "active")]){
        try {
            return await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                queries,
                

            )
        } catch (error) {
            console.log("Appwrite serive :: getPosts :: error", error);
            return false
        }
    }

    // file upload service

    async uploadFile(file){
        try {
            return await this.bucket.createFile(
                conf.appwriteBucketId,
                ID.unique(),
                file
            )
        } catch (error) {
            console.log("Appwrite serive :: uploadFile :: error", error);
            return false
        }
    }

    async deleteFile(fileId){
        try {
            await this.bucket.deleteFile(
                conf.appwriteBucketId,
                fileId
            )
            return true
        } catch (error) {
            console.log("Appwrite serive :: deleteFile :: error", error);
            return false
        }
    }

    getFilePreview(fileId){
        return this.bucket.getFilePreview(
            conf.appwriteBucketId,
            fileId
        )
    }

    // Course management methods
    async createCourse({title, description, sections}){
        try {
            console.log("Creating course with:", { title, description, sections });
            const courseCollectionId = conf.appwriteCourseCollectionId || conf.appwriteCoursesCollectionId;
            
            if (!courseCollectionId) {
                console.error("Course collection ID is undefined");
                return false;
            }
            
            const response = await this.databases.createDocument(
                conf.appwriteDatabaseId,
                courseCollectionId,
                ID.unique(),
                {
                    title,
                    description,
                    sections,
                    content: description || "", // Use description as content or empty string
                    averageRatingsString: "{}" // Initialize with empty stringified object
                }
            );
            console.log("Course created:", response);
            return response;
        } catch (error) {
            console.error("Appwrite service :: createCourse :: error", error);
            return false;
        }
    }

    async updateCourse(courseId, {title, description, sections}){
        try {
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCoursesCollectionId,
                courseId,
                {
                    title,
                    description,
                    sections
                }
            )
        } catch (error) {
            console.log("Appwrite service :: updateCourse :: error", error);
            return false;
        }
    }

    async getCourse(courseId){
        try {
            return await this.databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCoursesCollectionId,
                courseId
            )
        } catch (error) {
            console.log("Appwrite service :: getCourse :: error", error);
            return false;
        }
    }

    async getCourses(queries = []){
        try {
            console.log("Fetching courses with queries:", queries);
            const courseCollectionId = conf.appwriteCourseCollectionId || conf.appwriteCoursesCollectionId;
            
            if (!courseCollectionId) {
                console.error("Course collection ID is undefined");
                return false;
            }
            
            const response = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                courseCollectionId,
                queries
            );
            console.log("Courses fetched:", response);
            return response;
        } catch (error) {
            console.error("Appwrite service :: getCourses :: error", error);
            return false;
        }
    }

    async addVideoToCourse(courseId, fileId){
        try {
            console.log("Adding video to course:", { courseId, fileId });
            const courseCollectionId = conf.appwriteCourseCollectionId || conf.appwriteCoursesCollectionId;
            
            if (!courseCollectionId) {
                console.error("Course collection ID is undefined");
                return false;
            }
            
            const response = await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                courseCollectionId,
                courseId,
                {
                    fileId
                }
            );
            console.log("Video added to course:", response);
            return response;
        } catch (error) {
            console.error("Appwrite service :: addVideoToCourse :: error", error);
            return false;
        }
    }

    async addReview(courseId, userId, section, rating, comment = ""){
        try {
            console.log("Adding review:", { courseId, userId, section, rating, comment });
            // Check if review exists
            const existingReviews = await this.databases.listDocuments(
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
                response = await this.databases.updateDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteRatingCollectionId,
                    existingReviews.documents[0].$id,
                    { rating, comment }
                );
            } else {
                // Create new review
                response = await this.databases.createDocument(
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
            
            // Update course average ratings
            await this.updateCourseAverageRating(courseId);
            
            return response;
        } catch (error) {
            console.error("Appwrite service :: addReview :: error", error);
            return false;
        }
    }

    async getReviews(courseId, section = null){
        try {
            console.log("Getting reviews for course:", courseId, section ? `in section: ${section}` : "in all sections");
            const queries = [Query.equal('courseId', courseId)];
            if (section) {
                queries.push(Query.equal('section', section));
            }
            
            const response = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteRatingCollectionId,
                queries
            );
            console.log("Reviews fetched:", response);
            return response;
        } catch (error) {
            console.error("Appwrite service :: getReviews :: error", error);
            return false;
        }
    }

    async updateCourseAverageRating(courseId) {
        try {
            // Get all ratings for this course
            const ratings = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteRatingCollectionId,
                [Query.equal('courseId', courseId)]
            );
            
            // Calculate average ratings by section
            const sectionRatings = {};
            ratings.documents.forEach(rating => {
                if (!sectionRatings[rating.section]) {
                    sectionRatings[rating.section] = {
                        sum: 0,
                        count: 0
                    };
                }
                sectionRatings[rating.section].sum += rating.rating;
                sectionRatings[rating.section].count += 1;
            });
            
            // Convert to averages
            const averageRatings = {};
            for (const section in sectionRatings) {
                averageRatings[section] = sectionRatings[section].sum / sectionRatings[section].count;
            }
            
            // Stringify the averageRatings object for storage
            const averageRatingsString = JSON.stringify(averageRatings);
            
            // Update the course document
            const courseCollectionId = conf.appwriteCourseCollectionId || conf.appwriteCoursesCollectionId;
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                courseCollectionId,
                courseId,
                {
                    averageRatingsString: averageRatingsString
                }
            );
        } catch (error) {
            console.error("Appwrite service :: updateCourseAverageRating :: error", error);
            return false;
        }
    }
}

const service = new Service()
export default service