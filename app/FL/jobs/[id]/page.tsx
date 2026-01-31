'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * FL Jobs Detail Page
 * This page redirects to the FL projects detail page since
 * "jobs" are just "active projects" in the contract.
 */
export default function FLJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  useEffect(() => {
    // Redirect to the projects detail page
    router.replace(`/FL/projects/${jobId}`);
  }, [jobId, router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
    </div>
  );
}
