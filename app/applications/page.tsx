'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplicationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/FL/applications');
  }, [router]);

  return null;
}
