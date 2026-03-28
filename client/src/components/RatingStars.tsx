interface RatingStarsProps {
  value: number;
}

export function RatingStars({ value }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= Math.round(value) ? "text-amber-400" : "text-stone-600"}`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-stone-400">{value.toFixed(1)}</span>
    </div>
  );
}
