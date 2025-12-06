import React from "react";

// Update the interface to include the new props for the roadmap features
export interface NavItemProps {
  // Use React.ComponentType for simple prop definition, or use the Lucide type for strictness
  // Sticking closer to your original for the icon definition:
  icon: React.ComponentType<{ size?: number; className?: string }>; 
  label: string;
  active: boolean;
  onClick: () => void;
  // ✨ Added Props for Coming Soon features
  isComingSoon?: boolean; 
  comingSoonColor?: string; 
}

export default function NavItem({ 
    icon: Icon, 
    label, 
    active, 
    onClick,
    isComingSoon = false, // Default value
    comingSoonColor = "text-slate-400", // Default color
}: NavItemProps) {
  
  // Logic to determine classes based on active state and coming soon state
  let classes = "";
  let iconClasses = "";

  if (isComingSoon) {
    // Styling for unavailable features
    classes = `bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50 hover:bg-slate-800/80`;
    iconClasses = comingSoonColor; // Use the specific color for the icon
  } else if (active) {
    // Styling for the currently active feature
    classes = "bg-indigo-500/10 text-indigo-400 font-semibold";
    iconClasses = "scale-110";
  } else {
    // Styling for inactive but available features
    classes = "text-slate-400 hover:bg-white/5 hover:text-slate-200";
    iconClasses = "group-hover:scale-110";
  }

  // Handle the click logic: disable click if coming soon
  const handleClick = isComingSoon ? () => {} : onClick;

  return (
    <button
      onClick={handleClick}
      disabled={isComingSoon} // Disable the button element itself
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${classes}`}
    >
      <Icon
        size={20}
        className={iconClasses}
      />
      <span className={`${isComingSoon ? 'opacity-70' : ''}`}>{label}</span>
      
      {/* Badge for coming soon */}
      {isComingSoon && (
        <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${comingSoonColor} bg-slate-700/50`}>
          Soon
        </span>
      )}
    </button>
  );
}