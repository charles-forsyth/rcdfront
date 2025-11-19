import React from 'react';

interface UtilizationBarProps {
  percentage: number;
  label: string;
  bgColor?: string;
  height?: string;
  ariaLabel?: string;
}

const UtilizationBar: React.FC<UtilizationBarProps> = ({
  percentage,
  label,
  bgColor = 'bg-blue-500',
  height = 'h-5',
  ariaLabel,
}) => {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
        <span>{label}</span>
        <span>{safePercentage.toFixed(0)}%</span>
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden shadow-inner`}>
        <div
          className={`${bgColor} ${height} rounded-full transition-all duration-500 ease-out flex items-center justify-center text-white text-[10px] font-medium`}
          style={{ width: `${safePercentage}%` }}
          role="progressbar"
          aria-valuenow={safePercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel || label}
        >
          {/* Optional: Show percentage inside bar if wide enough */}
          {/* {safePercentage > 10 && `${safePercentage.toFixed(0)}%`} */}
        </div>
      </div>
    </div>
  );
};

export default UtilizationBar;
