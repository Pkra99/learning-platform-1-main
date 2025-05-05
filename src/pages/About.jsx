import React from 'react'

export default function About() {
  return (
    <div className="py-16 bg-white">
      <div className="container m-auto px-6 text-gray-600 md:px-12 xl:px-6">
        <div className="space-y-6 md:space-y-0 md:flex md:gap-6 lg:items-center lg:gap-12">
          <div className="md:5/12 lg:w-5/12">
            <img
              src="https://i.ibb.co/Wp5kfCm4/Whats-App-Image-2025-05-02-at-12-21-31-AM.jpg"
              alt="image"
            />
          </div>
          <div className="md:7/12 lg:w-6/12">
            <h2 className="text-2xl text-gray-900 font-bold md:text-4xl">
              Welcome to Learning Platform - Learn Your Way!
            </h2>
            <p className="mt-6 text-gray-600">
              Unlock your potential with an interactive learning experience
              tailored just for you. At Learning Platform, we believe in the
              power of personalized education, whether you’re brushing up on
              basics, exploring a new subject, or mastering advanced concepts.
              Here’s how we make learning engaging and effective:
            </p>
            <p className="mt-6 text-gray-600">
              Interactive Video Lessons: Dive into a library of expertly curated
              courses led by passionate instructors. Each video is designed to
              be engaging and interactive, helping you learn and retain concepts
              in real time.
            </p>
            <p className="mt-6 text-gray-600">
              Flexible Learning: Learn at your own pace from anywhere, on any
              device. Whether you’re working through a series of lessons or
              dropping in on a single topic, the platform adapts to your needs.
            </p>
            <p className="mt-4 text-gray-600">
              Ready to learn, grow, and achieve? Get started today with
              Platform Learning—your gateway to unlimited knowledge and skills!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}