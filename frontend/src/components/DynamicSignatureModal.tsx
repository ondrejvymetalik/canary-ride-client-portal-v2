'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamic import with loading state
const SignatureModal = dynamic(() => import('./SignatureModal'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading signature pad...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false, // Don't server-side render this component
});

type SignatureModalProps = ComponentProps<typeof SignatureModal>;

export default function DynamicSignatureModal(props: SignatureModalProps) {
  // Only render if the modal should be open
  if (!props.isOpen) {
    return null;
  }

  return <SignatureModal {...props} />;
}