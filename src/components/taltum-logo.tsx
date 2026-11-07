export function TaltumLogo({
  variant = "dark",
  showSubtitle = true,
  iconOnly = false,
}: {
  variant?: "dark" | "light";
  showSubtitle?: boolean;
  iconOnly?: boolean;
}) {
  const textColor = variant === "light" ? "text-white" : "text-petrol";
  const subtitleColor =
    variant === "light" ? "text-white/70" : "text-gray-soft";

  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="9"
          fill={variant === "light" ? "#164860" : "#0b2430"}
        />
        <path
          d="M10 13H30V16.5H21.8V29H18.2V16.5H10V13Z"
          fill="#FAF8F5"
        />
        <path d="M23.5 21.5H30V25H23.5V21.5Z" fill="#B8963A" />
        <circle cx="13.5" cy="25.5" r="2.5" fill="#D4AF5A" />
      </svg>
      {!iconOnly && (
        <div className="leading-tight">
          <div className={`text-lg font-bold tracking-tight ${textColor}`}>
            Taltum
            <span className="ml-1.5 text-xs font-semibold uppercase tracking-widest text-dorado-light">
              Gestión
            </span>
          </div>
          {showSubtitle && (
            <p className={`text-[11px] ${subtitleColor}`}>
              Talento · Productividad · Bienestar
            </p>
          )}
        </div>
      )}
    </div>
  );
}
