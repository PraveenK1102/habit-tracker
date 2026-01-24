import React, { useRef, useState, useEffect } from 'react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    const paddedDay = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
    const localDate = `${d.getFullYear()}-${paddedMonth}-${paddedDay}`;

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

  let monthTracker = {previousMonth: null};
  for (let i = -numWeeksBefore; i <= numWeeksAfter; i++) {
    const weekStart = new Date(centerStart);
    weekStart.setDate(centerStart.getDate() + i * 7);
    if (monthTracker.previousMonth === null) {
      monthTracker.previousMonth = weekStart.getMonth()
    }
    weeks.push(...generateWeek(weekStart, monthTracker.previousMonth));
    const weekEnd = new Date(centerStart);
    weekEnd.setDate(centerStart.getDate() + (i * 7) + 6);
    monthTracker.previousMonth = weekEnd.getMonth();
  }  
  return weeks;
}

function formatYMD(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${mm}-${dd}`;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateRef = useRef<HTMLDivElement>(null);
  const todayDateRef = useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weeks, setWeeks] = useState<CalendarDate[]>(() => generateWeeks(selectedDate, 4, 4));

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
    setCalendarOpen(!calendarOpen)
  };

  // const navigateToToday = (e) => {
  //   e?.preventDefault();
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const formatted = formatYMD(today);
  //   setSelectedDate(today);
  //   setCurrentDate(formatted);
  //   onDateSelect(formatted);
  //   if (todayDateRef.current) {
  //     todayDateRef.current.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
  //   }
  // }
  const navigateToCurrentDate = (e) => {
    e?.preventDefault();
    requestAnimationFrame(() => {
      if (selectedDateRef.current) {
        selectedDateRef.current.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }
    });
  }
  useEffect(() => {
    navigateToCurrentDate(null);
  }, []);

  const openCalendar = () => {
    setCalendarOpen(!calendarOpen);
    navigateToCurrentDate(null);
  }
  return (
    <div>
      <div className="my-3 lg:mb-3 flex justify-between">
        <small>{selectedDate.toDateString()}</small>
        {!calendarOpen && (
          <button className="text-sm text-blue-400" onClick={openCalendar}>Change Date</button>
          )}
      </div>
      {calendarOpen && (
        
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto lg:space-x-2 border rounded bg-white dark:bg-black py-2 lg:py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          style={{ scrollbarWidth: 'thin' }}
        >
          {weeks.map(({ date = new Date(), date_formatted = '', isNextMonthStarted = false }, index) => {
            let selectedDateTemp = date?.toDateString() === selectedDate?.toDateString();
            let todayDateTemp = date?.toDateString() === new Date().toDateString();
            return (
              <React.Fragment key={index}>
                {isNextMonthStarted && (
                  <div
                    className="w-16 lg:w-34 min-w-[50px] lg:min-w-[8rem] flex justify-center items-center border rounded py-2 cursor-pointer 
                    select-none transition-all bg-gray-100 dark:bg-gray-800 sticky left-0 font-bold text-xs touch-manipulation"
                  >
                    <div className="flex flex-col md:flex-row items-center">
                      <span className="text-center">
                        {date.toDateString().split(' ')[1]}
                      </span>
                      <span className="text-center md:pt-0 md:pl-1 pt-2">
                        {date.getFullYear()}
                    </span>
                    </div>
                  
                  </div>
                )}
                <div
                  ref={selectedDateTemp ? selectedDateRef : todayDateTemp ? todayDateRef : null}
                  onClick={() => handleDateClick(date, date_formatted)}
                  className={`w-16 lg:w-24 min-w-[3.5rem] mx-1 lg:min-w-[6rem] text-center border rounded py-2 cursor-pointer select-none transition-all touch-manipulation text-xs
                    ${currentDate === date_formatted ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <div className="font-semibold">{date?.getDate()}</div>
                  <div className="hidden lg:block">{WEEKDAYS[date?.getDay()]}</div>
                  <div className="lg:hidden">{WEEKDAYS[date?.getDay()].slice(0, 3)}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>  
      )}
    </div>
  );
})
