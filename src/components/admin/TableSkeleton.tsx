import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      {/* Table Header */}
      <div className="flex bg-black/2 p-4 border-b border-black/5">
        {[...Array(columns)].map((_, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded bg-black/5 mx-2"
          />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-black/5">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex p-4 items-center">
            {[...Array(columns)].map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-4 flex-1 rounded bg-black/3 mx-2 ${
                  colIndex === 0 ? "max-w-30" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
