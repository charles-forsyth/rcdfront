import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Grant, GrantStatus } from '../types';
import { Link } from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface GrantsGanttChartProps {
  grants: Grant[];
  getStatusColor: (status: GrantStatus) => string; // Expects "text-color bg-color border-color"
  getResearcherName: (researcherId?: string) => string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ROW_HEIGHT = 36; // px, includes padding for the grant row - CHANGED from 48
const Y_AXIS_WIDTH = 280; // px, width for grant titles and PI
const MONTH_COL_WIDTH = 100; // px, width for each month column in the timeline
const HEADER_ROW_HEIGHT = 40; // px, height for the month header row

const getDaysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

const GrantsGanttChart: React.FC<GrantsGanttChartProps> = ({ grants, getStatusColor, getResearcherName }) => {
  const [tooltip, setTooltip] = useState<{ content: React.ReactNode, x: number, y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const yAxisScrollRef = useRef<HTMLDivElement>(null);
  const ganttRootRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const mainArea = scrollContainerRef.current;
    const headerArea = headerScrollRef.current;
    const yAxisArea = yAxisScrollRef.current;

    if (!mainArea || !headerArea || !yAxisArea) return;

    // This handler synchronizes the scroll positions
    const handleMainScroll = () => {
      if (headerArea) { // Sync horizontal scroll for month headers
        headerArea.scrollLeft = mainArea.scrollLeft;
      }
      if (yAxisArea) { // Sync vertical scroll for grant names (Y-axis)
        yAxisArea.scrollTop = mainArea.scrollTop;
      }
    };

    mainArea.addEventListener('scroll', handleMainScroll);

    return () => {
      mainArea.removeEventListener('scroll', handleMainScroll);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount


  const { timelineMonths, minDate, totalMonths } = useMemo(() => {
    if (grants.length === 0) {
      return { timelineMonths: [], minDate: new Date(), totalMonths: 0 };
    }

    let overallMinDate = new Date(grants[0].startDate);
    let overallMaxDate = new Date(grants[0].endDate);

    grants.forEach(grant => {
      const start = new Date(grant.startDate);
      const end = new Date(grant.endDate);
      if (start < overallMinDate) overallMinDate = start;
      if (end > overallMaxDate) overallMaxDate = end;
    });
    
    // Pad min/max dates to provide some visual space around the grant bars
    const paddedMinDate = new Date(overallMinDate.getFullYear(), overallMinDate.getMonth() -1, 1); // Go back one month
    let tempMaxDate = new Date(overallMaxDate.getFullYear(), overallMaxDate.getMonth() + 2, 0); // Go forward two months, get last day

    const months = [];
    let currentDate = new Date(paddedMinDate.getFullYear(), paddedMinDate.getMonth(), 1);
    
    // Ensure the timeline is wide enough, e.g., at least 6 months or viewport width
    const minTimelineDurationMonths = Math.max(6, Math.ceil((ganttRootRef.current?.clientWidth || window.innerWidth * 0.7) / MONTH_COL_WIDTH));
    let iterations = 0; 
    const maxIterations = 360; // Approx 30 years to prevent infinite loops

    while (iterations++ < maxIterations && (currentDate <= tempMaxDate || months.length < minTimelineDurationMonths)) {
        months.push({ year: currentDate.getFullYear(), monthIndex: currentDate.getMonth() });
        currentDate.setMonth(currentDate.getMonth() + 1);
        // If we haven't reached min duration and passed tempMaxDate, extend tempMaxDate
        if (months.length < minTimelineDurationMonths && tempMaxDate < currentDate) {
            tempMaxDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        }
    }
    
    return { timelineMonths: months, minDate: paddedMinDate, totalMonths: months.length };

  }, [grants]);


  if (grants.length === 0) {
    return <p className="text-center text-gray-500 py-10">No grants to display in Gantt chart.</p>;
  }
  
  const totalGanttDataAreaWidth = totalMonths * MONTH_COL_WIDTH;
  const ganttDataAreaHeight = grants.length * ROW_HEIGHT;

  const handleMouseEnter = (event: React.MouseEvent, grant: Grant) => {
    const xPos = event.pageX + 15;
    const yPos = event.pageY - 10;

    const content = (
      <div className="text-xs space-y-0.5">
        <p className="font-bold">{grant.title}</p>
        <p>PI: {getResearcherName(grant.principalInvestigatorId)}</p>
        <p>Status: {grant.status}</p>
        <p>Dates: {new Date(grant.startDate).toLocaleDateString()} - {new Date(grant.endDate).toLocaleDateString()}</p>
        <p>Amount: ${grant.amount.toLocaleString()}</p>
      </div>
    );
    setTooltip({ content, x: xPos, y: yPos });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  

  return (
    <div ref={ganttRootRef} className="gantt-root-container bg-white shadow-lg rounded-lg p-1 sm:p-2 md:p-4 relative grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] max-h-[75vh] border border-gray-200">
      {/* Corner Piece (Top-Left) */}
      <div 
        className="bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center p-2 z-30 sticky top-0 left-0"
        style={{ width: `${Y_AXIS_WIDTH}px`, height: `${HEADER_ROW_HEIGHT}px` }}
        aria-hidden="true"
      >
        <span className="text-sm font-semibold text-gray-700 truncate">Grant / PI</span>
      </div>

      {/* Month Headers (Top-Right, scrolls X with JS) */}
      <div 
        ref={headerScrollRef}
        className="bg-white border-b border-gray-300 overflow-x-hidden z-20 sticky top-0"
        style={{ height: `${HEADER_ROW_HEIGHT}px`}}
        aria-hidden="true" // Screen readers will interact with the main content area
      >
        <div className="flex" style={{ width: `${totalGanttDataAreaWidth}px` }}>
          {timelineMonths.map((m) => (
            <div
              key={`${m.year}-${m.monthIndex}-header`}
              className="flex-none text-center text-xs font-medium text-gray-600 py-2 border-r border-gray-200 flex items-center justify-center"
              style={{ width: `${MONTH_COL_WIDTH}px`, height: '100%' }}
            >
              {MONTH_NAMES[m.monthIndex]} '{m.year.toString().slice(-2)}
            </div>
          ))}
        </div>
      </div>

      {/* Y-Axis Grant List (Bottom-Left, scrolls Y with JS) */}
      <div 
        ref={yAxisScrollRef}
        className="bg-gray-100 border-r border-gray-300 overflow-y-hidden z-10 sticky left-0"
        style={{ width: `${Y_AXIS_WIDTH}px` }}
        aria-hidden="true" // Screen readers will interact with the main content area
      >
        <div style={{height: `${ganttDataAreaHeight}px`}}>
            {grants.map((grant) => (
            <div
                key={`yaxis-${grant.id}`}
                className="flex flex-col justify-center px-3 border-b border-gray-200 truncate"
                style={{ height: `${ROW_HEIGHT}px` }}
                title={`${grant.title}\nPI: ${getResearcherName(grant.principalInvestigatorId)}`}
            >
                <Link to={`/grants#${grant.id}`} className="text-sm font-medium text-blue-700 hover:underline truncate" tabIndex={-1}>
                  {grant.title}
                </Link>
                <span className="text-xs text-gray-500 truncate">
                  PI: {getResearcherName(grant.principalInvestigatorId)}
                </span>
            </div>
            ))}
        </div>
      </div>

      {/* Gantt Bars and Grid Area (Bottom-Right, scrolls X and Y) */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-auto z-0"
        style={{ height: '100%', width: '100%' }}
        role="region"
        aria-label="Grants Gantt Chart Timeline"
        tabIndex={0} // Make it focusable for keyboard scrolling
      >
        <div className="relative" style={{ width: `${totalGanttDataAreaWidth}px`, height: `${ganttDataAreaHeight}px` }}>
          {/* Background Grid Lines for months */}
          {timelineMonths.map((m, index) => (
            <div 
              key={`gridline-month-${m.year}-${m.monthIndex}`} 
              className="absolute top-0 bottom-0 border-r border-dashed border-gray-200" 
              style={{ left: `${index * MONTH_COL_WIDTH}px`, width: `${MONTH_COL_WIDTH}px`, zIndex: 0 }}
              aria-hidden="true"
            ></div>
          ))}
           {/* Background Grid Lines for rows */}
          {grants.map((_grant, grantIndex) => (
             <div
                key={`gridline-row-${grantIndex}`}
                className="absolute left-0 right-0 border-b border-dashed border-gray-200"
                style={{ top: `${(grantIndex + 1) * ROW_HEIGHT -1}px`, height: '1px', zIndex: 0 }} // -1 for border thickness
                aria-hidden="true"
             ></div>
          ))}
          {/* Grant Bars */}
          {grants.map((grant, grantIndex) => {
             const grantStartDate = new Date(grant.startDate);
             const grantEndDate = new Date(grant.endDate);
             
             // Calculate start position
             const startOffsetMonthsTotal = (grantStartDate.getFullYear() - minDate.getFullYear()) * 12 + (grantStartDate.getMonth() - minDate.getMonth());
             const startDayInMonthFraction = (grantStartDate.getDate() -1) / getDaysInMonth(grantStartDate.getFullYear(), grantStartDate.getMonth());
             let barStartRelativeToTimelineStartMonths = startOffsetMonthsTotal + startDayInMonthFraction;
             let leftPositionPx = barStartRelativeToTimelineStartMonths * MONTH_COL_WIDTH;

             // Calculate end position
             const endOffsetMonthsTotal = (grantEndDate.getFullYear() - minDate.getFullYear()) * 12 + (grantEndDate.getMonth() - minDate.getMonth());
             const endDayInMonthFraction = grantEndDate.getDate() / getDaysInMonth(grantEndDate.getFullYear(), grantEndDate.getMonth());
             let barEndRelativeToTimelineStartMonths = endOffsetMonthsTotal + endDayInMonthFraction;
             
             // Adjust if bar starts before the visible timeline
             if (barStartRelativeToTimelineStartMonths < 0) {
                 leftPositionPx = 0; 
             }
             
             // Ensure width calculation is based on the visible portion within the timeline
             const visibleStartPointMonths = Math.max(0, barStartRelativeToTimelineStartMonths);
             const visibleEndPointMonths = Math.max(visibleStartPointMonths, barEndRelativeToTimelineStartMonths); // End must be after start
             
             const barWidthPx = Math.max(5, (visibleEndPointMonths - visibleStartPointMonths) * MONTH_COL_WIDTH); // Min width of 5px

             const statusColorClasses = getStatusColor(grant.status);
             const bgColor = statusColorClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-400';
             const borderColor = statusColorClasses.split(' ').find(c => c.startsWith('border-')) || 'border-gray-500';
             const textColorClasses = statusColorClasses.split(' ').find(c => c.startsWith('text-')) || 'text-white';
            return (
              <div
                key={`grant-bar-${grant.id}`}
                className={`absolute rounded ${bgColor} ${borderColor} border h-[60%] flex items-center px-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow group`}
                style={{
                  top: `${grantIndex * ROW_HEIGHT + (ROW_HEIGHT * 0.2)}px`, // 0.2 for centering a 60% height bar
                  left: `${leftPositionPx}px`,
                  width: `${barWidthPx}px`,
                  zIndex: 1, // Bars on top of grid lines
                }}
                onMouseMove={(e) => handleMouseEnter(e, grant)}
                onMouseLeave={handleMouseLeave}
                role="button"
                aria-label={`${grant.title}, PI: ${getResearcherName(grant.principalInvestigatorId)}, Status: ${grant.status}, Dates: ${new Date(grant.startDate).toLocaleDateString()} to ${new Date(grant.endDate).toLocaleDateString()}`}
                tabIndex={0} // Make bars focusable
                onClick={() => { const link = document.getElementById(`grant-link-${grant.id}`); if(link) link.click();}}
                onKeyPress={(e) => { if(e.key === 'Enter' || e.key === ' ') { const link = document.getElementById(`grant-link-${grant.id}`); if(link) link.click();}}}

              >
                <Link id={`grant-link-${grant.id}`} to={`/grants#${grant.id}`} className="hidden" aria-hidden="true">Details for {grant.title}</Link>
                <span className={`text-xs font-medium truncate ${textColorClasses}`}>
                  {grant.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed bg-black bg-opacity-80 text-white p-2 rounded-md shadow-xl pointer-events-none z-[100]"
          style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px`, transform: 'translateY(-100%)' }}
          role="tooltip"
        >
          {tooltip.content}
        </div>
      )}
       <div className="col-span-2 mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-600 flex items-start">
        <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500 shrink-0" />
        <div>
            Gantt chart displays managed grants. Hover over bars for details. The chart is scrollable both vertically and horizontally.
            Colors indicate grant status.
        </div>
      </div>
    </div>
  );
};

export default GrantsGanttChart;