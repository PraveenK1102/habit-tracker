import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "next-themes";

interface CalendarDate {
  date: Date;
  date_formatted: string;
  isNextMonthStarted: boolean;
}

function getStartOfWeek(date = new Date()): Date {
  const d = new Date(date);
  d.setDate(date.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateWeek(startDate: Date, previousMonth: number): CalendarDate[] {  
  let isNextMonthStartCalculated = false;
  let isNextMonthStarted = false;
  const result: CalendarDate[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    let currentMonth = d.getMonth();
    const paddedMonth = currentMonth < 9 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const localDate = `${d.getFullYear()}-${paddedMonth}-${d.getDate()}`;

    if (!isNextMonthStartCalculated && currentMonth !== previousMonth) {
      previousMonth = currentMonth;
      isNextMonthStartCalculated = true;
      isNextMonthStarted = true;
    } else {
      isNextMonthStarted = false;
    }
    result.push({
      date: d,
      date_formatted: localDate,
      isNextMonthStarted: isNextMonthStarted
    });
  }
  return result;
}


function generateWeeks(
  centerDate = new Date(), 
  numWeeksBefore = 4, 
  numWeeksAfter = 4
): CalendarDate[] {
  const centerStart = getStartOfWeek(centerDate);
  const weeks: CalendarDate[] = [];

  let obj = {previousMonth: null};
  for (let i = -numWeeksBefore; i <= numWeeksAfter; i++) {
    const weekStart = new Date(centerStart);
    weekStart.setDate(centerStart.getDate() + i * 7);
    if (obj.previousMonth === null) {
      obj.previousMonth = weekStart.getMonth()
    }
    weeks.push(...generateWeek(weekStart, obj.previousMonth));
    const weekEnd = new Date(centerStart);
    weekEnd.setDate(centerStart.getDate() + (i * 7) + 6);
    obj.previousMonth = weekEnd.getMonth();
  }  
  return weeks;
}

export default React.memo(function HorizontalWeekCalendar(
  { 
    onDateSelect,
    currentDate,
    setCurrentDate
   }: { 
    onDateSelect: (date: string) => void
    currentDate: string;
    setCurrentDate: (date: string) => void
  }) {
  // const { resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState<CalendarDate[]>(() => generateWeeks(selectedDate, 4, 4));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  console.log("Calendar component loaded")
  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;

    if (scrollLeft + clientWidth >= scrollWidth - 100) {
      const lastDate = weeks[weeks.length - 1];
      const newWeeks = generateWeeks(lastDate.date, 0, 1);
      setWeeks((prev) => [...prev, ...newWeeks.slice(7)]);
    }

    if (scrollLeft <= 100) {
      const firstDate = weeks[0];
      const newWeeks = generateWeeks(firstDate.date, 1, 0);
      setWeeks((prev) => [...newWeeks.slice(0, 7), ...prev]);

      requestAnimationFrame(() => {
        scrollElement.scrollLeft += 7 * 60;
      });
    }
  };

  const handleDateClick = (date: Date, date_formatted: string) => {
    setSelectedDate(date);
    setCurrentDate(date_formatted);
    onDateSelect(date_formatted);
  };

  const navigateToCurrentDate = (e) => {
    e?.preventDefault();
    if (selectedDateRef.current) {
      selectedDateRef.current.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    }
  }
  useEffect(() => {
    navigateToCurrentDate(null);
  }, []);

  return (
    <div className="w-full">
      <div class="mb-3">
        <a
          href="#"
          className="mt-4 text-sm text-blue-500 hover:text-blue-700 py-4"
          onClick={navigateToCurrentDate}
          >
          Now At - {selectedDate.toDateString()}
        </a>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-scroll space-x-2 border rounded bg-white dark:bg-black pb-4 pt-2 text-xs"
      >
        {weeks.map(({ date = new Date(), date_formatted = '', isNextMonthStarted = false }, index) => {
          let selectedDateTemp = date?.toDateString() === selectedDate?.toDateString();
          return (
            <React.Fragment key={index}>
              {isNextMonthStarted && (
                <div
                  className="w-34 min-w-[8rem] flex justify-center items-center border rounded py-2 cursor-pointer 
                  select-none transition-all bg-gray-100 dark:bg-gray-800 sticky left-0 font-bold"
                >
                  {date.toDateString().split(' ')[1]} {date.getFullYear()}
                </div>
              )}
              <div
                ref={selectedDateTemp ? selectedDateRef : null}
                onClick={() => handleDateClick(date, date_formatted)}
                className={`w-24 min-w-[6rem] text-center border rounded py-2 cursor-pointer select-none transition-all
                  ${currentDate === date_formatted ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <div className="font-semibold">{date?.getDate()}</div>
                <div className="text-xs">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date?.getDay()]}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
})
