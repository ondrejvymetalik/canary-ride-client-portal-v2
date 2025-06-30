'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from '@/components/ui/Icon';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSave,
  title = 'Add Your Signature'
}: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!isOpen) return null;

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const saveSignature = () => {
    if (sigCanvas.current && !isEmpty) {
      const signature = sigCanvas.current.getTrimmedCanvas().toDataURL();
      onSave(signature);
      onClose();
    }
  };

  const handleBeginStroke = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Please draw your signature in the box below using your finger or mouse.
          </p>

          {/* Signature Canvas */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                width: 400,
                height: 200,
                className: 'signature-canvas w-full h-full',
                style: { touchAction: 'none' }
              }}
              onBegin={handleBeginStroke}
              backgroundColor="rgb(249, 250, 251)"
            />
          </div>

          {/* Instructions */}
          <p className="text-xs text-gray-500 mb-6">
            Your signature will be used to confirm your agreement to the terms and conditions.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={clearSignature}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              disabled={isEmpty}
            >
              <RotateCcw size={16} />
              Clear
            </button>
            <button
              onClick={saveSignature}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isEmpty}
            >
              <Check size={16} />
              Save Signature
            </button>
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