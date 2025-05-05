import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues, formState: { errors } } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imageFile, setImageFile] = useState(null);
    
    // Debug user authentication state
    useEffect(() => {
        console.log("Current userData state:", userData);
    }, [userData]);

    const submit = async (data) => {
        setLoading(true);
        setError("");
        
        try {
            // Debug authentication check
            console.log("Authentication check - userData:", userData);
            
            // Check if user is logged in - modified check
            if (!userData || !userData.$id) {
                console.error("User authentication issue:", userData);
                setError("Authentication error. Please try logging out and logging back in.");
                setLoading(false);
                return;
            }
            
            // Validate required fields
            if (!data.title || !data.slug || !data.content) {
                setError("Title, slug, and content are required");
                setLoading(false);
                return;
            }

            if (post) {
                // Update existing post
                let featuredImageId = post.featuredImage;
                
                // If a new image was selected
                if (data.image && data.image[0]) {
                    const file = await appwriteService.uploadFile(data.image[0]);
                    
                    if (file) {
                        // Delete old image if it exists
                        if (post.featuredImage) {
                            await appwriteService.deleteFile(post.featuredImage);
                        }
                        featuredImageId = file.$id;
                    } else {
                        setError("Failed to upload image");
                        setLoading(false);
                        return;
                    }
                }

                const dbPost = await appwriteService.updatePost(post.$id, {
                    title: data.title,
                    content: data.content,
                    featuredImage: featuredImageId,
                    status: data.status,
                });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                } else {
                    setError("Failed to update post");
                }
            } else {
                // Create new post
                if (!data.image || !data.image[0]) {
                    setError("Featured image is required");
                    setLoading(false);
                    return;
                }
                
                const file = await appwriteService.uploadFile(data.image[0]);

                if (file) {
                    const fileId = file.$id;
                    console.log("Creating post with userId:", userData.$id);
                    
                    const dbPost = await appwriteService.createPost({
                        title: data.title,
                        slug: data.slug,
                        content: data.content,
                        featuredImage: fileId,
                        status: data.status,
                        userId: userData.$id,
                    });

                    if (dbPost) {
                        navigate(`/post/${dbPost.$id}`);
                    } else {
                        setError("Failed to create post");
                        // Clean up the uploaded file if post creation fails
                        await appwriteService.deleteFile(fileId);
                    }
                } else {
                    setError("Failed to upload image");
                }
            }
        } catch (error) {
            console.error("Error in post submission:", error);
            setError(`An error occurred: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");

        return "";
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            {error && (
                <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { 
                        required: "Title is required",
                        minLength: {
                            value: 3,
                            message: "Title must be at least 3 characters"
                        }
                    })}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
                
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { 
                        required: "Slug is required",
                        pattern: {
                            value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                            message: "Invalid slug format"
                        }
                    })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
                )}
                
                <RTE 
                    label="Content :" 
                    name="content" 
                    control={control} 
                    defaultValue={getValues("content")}
                    rules={{ required: "Content is required" }}
                />
                {errors.content && (
                    <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                )}
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { 
                        required: !post ? "Featured image is required" : false,
                        validate: {
                            fileType: (value) => {
                                if (!value || !value[0]) return true;
                                const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
                                return acceptedTypes.includes(value[0].type) || "Invalid file type";
                            },
                            fileSize: (value) => {
                                if (!value || !value[0]) return true;
                                return value[0].size <= 5000000 || "File size must be less than 5MB";
                            }
                        }
                    })}
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setImageFile(URL.createObjectURL(e.target.files[0]));
                        }
                    }}
                />
                {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
                )}
                
                {imageFile && (
                    <div className="w-full mb-4">
                        <img
                            src={imageFile}
                            alt="Selected image"
                            className="rounded-lg"
                        />
                    </div>
                )}
                
                {post && !imageFile && post.featuredImage && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: "Status is required" })}
                />
                {errors.status && (
                    <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
                
                <Button 
                    type="submit" 
                    bgColor={post ? "bg-green-500" : undefined} 
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? "Saving..." : (post ? "Update" : "Submit")}
                </Button>
            </div>
        </form>
    );
}
