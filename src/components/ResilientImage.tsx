import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveAssetUrl } from '../utils/api.ts';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackLabel }: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F3ECE0] text-[#465066] border border-[#E2D8C5] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-10 h-10 mb-3 flex items-center justify-center border border-[#7A1C24]/25 text-[#7A1C24]">
          <ImageOff className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <span className="text-xs font-medium text-[#131B2E] line-clamp-2 max-w-[180px]">
          {fallbackLabel || alt}
        </span>
        <span className="text-[11px] text-[#465066] mt-1">Chưa có ảnh sản phẩm</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
