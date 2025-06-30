'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: { signature: string; signedAt: string }) => void;
  contractNumber?: string;
}

export default function SignatureModal({ isOpen, onClose, onSign, contractNumber }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSign = () => {
    if (sigCanvas.current && !isEmpty) {
      const signatureData = {
        signature: sigCanvas.current.toDataURL('image/png'),
        signedAt: new Date().toISOString()
      };
      onSign(signatureData);
      handleClear();
      onClose();
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-2xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sign Rental Agreement
                </h3>
                {contractNumber && (
                  <p className="text-sm text-gray-600">
                    Contract #{contractNumber}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please draw your signature in the box below using your mouse or finger.
              </p>
              <p className="text-xs text-gray-500">
                By signing, you agree to the terms and conditions of the rental agreement.
              </p>
            </div>

            {/* Signature Canvas */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 608,
                  height: 200,
                }}
                backgroundColor="white"
                penColor="black"
                onBegin={handleBegin}
              />
            </div>

            {/* Instructions */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Draw your signature above</span>
              <span className="text-primary-600 font-medium">
                {isEmpty ? 'Waiting for signature...' : 'Signature captured'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClear}
                disabled={isEmpty}
                className="btn-outline btn-sm flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
              <button
                onClick={onClose}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={isEmpty}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Sign Contract
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Add to your global CSS file */
/*
.signature-canvas {
  touch-action: none;
  cursor: crosshair;
}
*/ 