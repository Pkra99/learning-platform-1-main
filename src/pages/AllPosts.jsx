import React, { useState, useEffect } from 'react'
import { Container, PostCard } from '../components'
import appwriteService from "../appwrite/config";

function AllPosts() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Fetch posts when component mounts
        setLoading(true)
        appwriteService.getPosts([])
            .then((posts) => {
                if (posts) {
                    setPosts(posts.documents)
                }
            })
            .catch((error) => {
                console.error("Error fetching posts:", error)
                setError("Failed to load posts. Please try again later.")
            })
            .finally(() => {
                setLoading(false)
            })
    }, []) // Empty dependency array means this runs once on mount

    return (
        <div className='w-full py-8'>
            <Container>
                {loading && <p>Loading posts...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && posts.length === 0 && (
                    <p>No posts found. Create your first post!</p>
                )}
                <div className='flex flex-wrap'>
                    {posts.map((post) => (
                        <div key={post.$id} className='p-2 w-1/4'>
                            <PostCard {...post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}

export default AllPosts