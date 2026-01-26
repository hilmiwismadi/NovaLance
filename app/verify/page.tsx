'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Verify is for freelancers to verify skills
    router.replace('/FL/profile');
  }, [router]);

  return null;
}
