"use client";
import Image from "next/image";
import { useState } from "react";

const ResponsiveBanner = ({
  banner,
  height = "h-[240px] sm:h-[280px] md:h-[320px] lg:h-[360px]",
  showOverlay = true,
  overlayOpacity = "bg-black/40",
  textPosition = "center",
  onClick,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(banner);
    } else if (banner.link) {
      window.location.href = banner.link;
    }
  };

  const getTextPositionClass = () => {
    switch (textPosition) {
      case "left":
        return "justify-start text-left";
      case "right":
        return "justify-end text-right";
      default:
        return "justify-center text-center";
    }
  };

  return (
    <div
      className={`relative w-full ${height} overflow-hidden rounded-xl shadow-lg cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      {/* Background Image or Gradient */}
      {banner.image_url && !imageError ? (
        <div className="absolute inset-0">
          <Image
            src={banner.image_url}
            alt={banner.name || banner.title || "Banner"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            quality={90}
            onError={() => setImageError(true)}
          />
          {showOverlay && <div className={`absolute inset-0 ${overlayOpacity}`} />}
        </div>
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            banner.bg_color || banner.bgColor || "from-gray-600 to-gray-800"
          }`}
        />
      )}

      {/* Content Overlay */}
      <div className={`relative z-10 h-full flex items-center ${getTextPositionClass()} px-4 sm:px-6 md:px-8`}>
        <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
          {/* Title */}
          {(banner.name || banner.title) && (
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight drop-shadow-lg break-words">
              {banner.name || banner.title}
            </h2>
          )}

          {/* Subtitle */}
          {banner.subtitle && (
            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-2 sm:mb-3 leading-relaxed drop-shadow-md break-words">
              {banner.subtitle}
            </p>
          )}

          {/* Description */}
          {banner.description && (
            <p className="text-xs sm:text-sm md:text-base text-white/80 mb-3 sm:mb-4 leading-relaxed drop-shadow-md break-words">
              {banner.description}
            </p>
          )}

          {/* Discount */}
          {banner.discount && (
            <div className="mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-yellow-400 drop-shadow-lg">
                {banner.discount}
              </span>
            </div>
          )}

          {/* Button */}
          {banner.button_text && (
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/30">
              {banner.button_text}
            </button>
          )}
        </div>
      </div>

      {/* Category Badge */}
      {banner.category && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/30">
            {banner.category}
          </span>
        </div>
      )}

      {/* Status Indicator */}
      {banner.active !== undefined && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${banner.active ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
        </div>
      )}
    </div>
  );
};

export default ResponsiveBanner;