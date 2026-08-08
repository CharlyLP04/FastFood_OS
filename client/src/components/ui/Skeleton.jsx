import React from 'react';

export function Skeleton({ className = '', variant = 'rect' }) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-[#1C1C20] via-[#2D2D35] to-[#1C1C20] rounded-xl bg-[length:200%_100%]";

  if (variant === 'circle') {
    return <div className={`${baseClasses} rounded-full ${className}`} />;
  }

  if (variant === 'text') {
    return <div className={`${baseClasses} h-4 w-3/4 rounded-md ${className}`} />;
  }

  return <div className={`${baseClasses} ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-[#141416] border border-[#242428] rounded-xl p-6 shadow-sm space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton variant="circle" className="w-10 h-10" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-[#242428]">
      <td className="p-4"><Skeleton className="h-4 w-12" /></td>
      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
      <td className="p-4"><Skeleton className="h-4 w-20 rounded-full" /></td>
      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
      <td className="p-4 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
    </tr>
  );
}
