import { Link, useLocation } from "react-router-dom";

// ==================== Section Title ====================
interface SectionTitleProps {
  title: string;
  description?: string;
}

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="section-title-landing mb-12">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

// ==================== Page Title / Breadcrumb ====================
interface PageTitleProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
}

export function PageTitle({ title, description, breadcrumbs }: PageTitleProps) {
  const location = useLocation();
  const defaultBreadcrumbs = [
    { label: "Home", to: "/home" },
    { label: title },
  ];
  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="page-title-section">
      <div className="container-landing">
        {/* Breadcrumb */}
        <nav className="flex justify-center mb-6">
          <ol className="flex items-center gap-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-[#496268]/40">/</span>}
                {item.to ? (
                  <Link
                    to={item.to}
                    className="breadcrumb-item no-underline flex items-center gap-1 text-[#496268] hover:text-[#049ebb] transition-colors"
                  >
                    {index === 0 && <i className="bi bi-house text-sm"></i>}
                    {item.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-item active text-[#049ebb] font-medium">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-[2.5rem] font-bold text-[#18444c] mb-4">{title}</h1>
          {description && (
            <p className="text-[#496268] text-base leading-relaxed max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Feature Item ====================
interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-12 h-12 min-w-[48px] rounded-xl bg-[#e6f7fb] text-[#049ebb] flex items-center justify-content-center">
        <i className={`${icon} text-xl`}></i>
      </div>
      <div>
        <h4 className="text-base font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-500 m-0">{description}</p>
      </div>
    </div>
  );
}

// ==================== Star Rating ====================
interface StarRatingProps {
  rating: number;
  showValue?: boolean;
}

export function StarRating({ rating, showValue = true }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="star-rating flex items-center gap-1">
      {Array.from({ length: fullStars }).map((_, i) => (
        <i key={`full-${i}`} className="bi bi-star-fill"></i>
      ))}
      {hasHalf && <i className="bi bi-star-half"></i>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <i key={`empty-${i}`} className="bi bi-star"></i>
      ))}
      {showValue && (
        <span className="text-sm text-gray-500 ml-1">({rating})</span>
      )}
    </div>
  );
}

// ==================== Info Badge ====================
interface InfoBadgeProps {
  icon: string;
  label: string;
  value: string;
}

export function InfoBadge({ icon, label, value }: InfoBadgeProps) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
      <i className={`${icon} text-xl text-[#049ebb]`}></i>
      <div>
        <span className="block text-xs text-white/60">{label}</span>
        <strong className="text-sm text-white">{value}</strong>
      </div>
    </div>
  );
}
