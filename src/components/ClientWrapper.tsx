"use client";

import { useEffect, useState } from "react";

interface ClientWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ClientWrapper = ({ children, fallback }: ClientWrapperProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
