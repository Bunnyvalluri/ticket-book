export default function MovieSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-xl shimmer" />
      <div className="p-2">
        <div className="h-3 rounded shimmer mt-2 w-3/4" />
        <div className="h-2.5 rounded shimmer mt-2 w-1/2" />
      </div>
    </div>
  );
}
