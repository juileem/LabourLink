import { useState } from "react";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";

export interface RatingPayload {
  rating: number;
  review: string;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RatingPayload) => Promise<void>;
  title: string;
}

export function RatingModal({ isOpen, onClose, onSubmit, title }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!review.trim()) {
      setError("Please leave a short review note.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({ rating, review });
      onClose();
      // Reset state for future opening
      setRating(0);
      setReview("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md relative">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        
        {error ? (
          <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <div className="flex justify-center items-center space-x-2 my-6">
          {[1, 2, 3, 4, 5].map((idx) => (
            <button
              key={idx}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(idx)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(idx)}
            >
              {(hoverRating >= idx || rating >= idx) ? (
                <StarIconSolid className="w-10 h-10 text-yellow-400" />
              ) : (
                <StarIconOutline className="w-10 h-10 text-stone-500 hover:text-yellow-400" />
              )}
            </button>
          ))}
        </div>

        <label className="block space-y-2 text-sm text-stone-200">
          <span className="font-medium text-stone-300">Review</span>
          <textarea
            className="w-full h-24 resize-none rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-stone-100 outline-none ring-0 transition placeholder:text-stone-500 focus:border-brand-400"
            placeholder="Write a short review note..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </label>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            onClick={() => {
              setError("");
              setRating(0);
              setReview("");
              onClose();
            }}
            disabled={loading}
            className="!bg-stone-800 hover:!bg-stone-700"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
