import React from "react";

export default function SkeletonCardProduct() {
  return (
    <div
      role="status"
      className="w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-sm p-4 md:p-5 animate-pulse dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Image placeholder */}
      <div className="flex items-center justify-center h-44 mb-5 bg-gradient-to-br from-gray-200 to-gray-300 rounded-md dark:from-gray-700 dark:to-gray-600">
        <svg
          className="w-12 h-12 text-gray-300 dark:text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14m18 0H3m18 0-4-4m-10 0 4-4 3 3 5-5 2 2" />
        </svg>
      </div>

      {/* Title placeholder */}
      <div className="h-3.5 w-2/3 rounded-full bg-gray-200 dark:bg-gray-600 mb-3"></div>

      {/* Description placeholder */}
      <div className="space-y-2 mb-4">
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-600"></div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 w-5/6"></div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 w-3/4"></div>
      </div>

      {/* Price + Button row */}
      <div className="flex items-center justify-between mt-auto">
        <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-600"></div>
        <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-600"></div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
