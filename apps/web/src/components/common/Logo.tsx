'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="logo" onClick={onClick} aria-label="KrishiConnect home">
      <span className="logo-mark">
        <Leaf size={22} fill="currentColor" />
      </span>
      <span>
        Krishi<span>Connect</span>
      </span>
    </Link>
  );
}

