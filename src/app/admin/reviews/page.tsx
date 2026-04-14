"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";

/* ================= TYPES ================= */

interface Review {
  _id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  review: string;
  isTestimonial: boolean;
  status: "VISIBLE" | "HIDDEN";
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [activeTab, setActiveTab] = useState<"PENDING" | "VISIBLE">("PENDING");

  /* ================= FETCH REVIEWS ================= */

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/admin/reviews", {
        params: { search, rating, testimonial, status: activeTab },
      });

      setReviews(data);
    } catch (error) {
      console.error("FETCH REVIEWS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [search, rating, testimonial, activeTab]);

  /* ================= ACTIONS ================= */

  const deleteReview = async (productId: string, reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await axios.delete(`/admin/reviews/${productId}/${reviewId}`);
      fetchReviews();
    } catch (error) {
      console.error("DELETE ERROR:", error);
    }
  };

  const updateStatus = async (productId: string, reviewId: string, status: "VISIBLE" | "HIDDEN") => {
    try {
      await axios.put(`/admin/reviews/${productId}/${reviewId}/status`, { status });
      fetchReviews();
    } catch (error) {
      console.error("UPDATE STATUS ERROR:", error);
    }
  };

  const toggleTestimonial = async (productId: string, reviewId: string) => {
    try {
      await axios.patch(
        `/admin/reviews/${productId}/${reviewId}/testimonial`
      );
      fetchReviews();
    } catch (error) {
      console.error("TESTIMONIAL ERROR:", error);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen p-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Reviews Management</h1>
        <p className="text-gray-500 mt-1">
          Moderate product reviews & testimonials
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 ${
            activeTab === "PENDING"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("PENDING")}
        >
          Pending Verifications
        </button>
        <button
          className={`py-3 px-6 text-sm font-medium border-b-2 ${
            activeTab === "VISIBLE"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("VISIBLE")}
        >
          Approved Reviews
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-bg-surface/80 rounded-2xl border shadow-sm p-6 grid grid-cols-4 gap-4">

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Search</label>
          <input
            type="text"
            placeholder="Search review or customer..."
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Rating</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Testimonial</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={testimonial}
            onChange={(e) => setTestimonial(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Only Testimonials</option>
            <option value="false">Non Testimonials</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch("");
              setRating("");
              setTestimonial("");
            }}
            className="w-full bg-bg-dark hover:bg-bg-dark/90 cursor-pointer text-white rounded-lg px-4 py-2 text-sm"
          >
            Reset Filters
          </button>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-bg-surface/80 rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-border-muted/20 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Product</th>
              <th className="px-6 py-4 text-left">Rating</th>
              <th className="px-6 py-4 text-left">Review</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  Loading reviews...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review._id} className="border-t hover:bg-bg-page/50">
                  <td className="px-6 py-4 font-medium">
                    {review.customerName}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {review.productName}
                  </td>

                  <td className="px-6 py-4">
                    ⭐ {review.rating}
                  </td>

                  <td className="px-6 py-4 max-w-xs truncate">
                    {review.review}
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 space-x-2">

                    {activeTab === "PENDING" ? (
                      <>
                        <button
                          onClick={() => updateStatus(review.productId, review._id, "VISIBLE")}
                          className="px-3 py-1 cursor-pointer text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => deleteReview(review.productId, review._id)}
                          className="px-3 py-1 cursor-pointer text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleTestimonial(review.productId, review._id)}
                          className={`px-3 py-1 text-xs rounded cursor-pointer ${
                            review.isTestimonial
                              ? "bg-amber-100 text-amber-700 font-medium"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {review.isTestimonial ? "Testimonial" : "Mark Fav"}
                        </button>
                        <button
                          onClick={() => deleteReview(review.productId, review._id)}
                          className="px-3 py-1 cursor-pointer text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
