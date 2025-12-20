import * as React from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { styled } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

dayjs.extend(isBetween);

const CustomPickersDay = styled(PickersDay)(
  ({ theme, selected, ownerState }) => ({
    ...(ownerState.isDark && {
      color: '#ffffff', 
    }),

    ...(selected && {
      backgroundColor: ownerState.isDark ? '#ffffff' : theme.palette.primary.main,
      color: ownerState.isDark ? '#000000' : theme.palette.primary.contrastText,
      borderRadius: '50%',
      '&:hover, &:focus': {
        backgroundColor: ownerState.isDark ? '#e6e6e6' : theme.palette.primary.dark,
      },
    }),
  })
);

function DayRange(props) {
  const { day, start, end, isDark, ...other } = props;

  const isSelected =
    start &&
    end &&
    (day.isSame(start, 'day') ||
      day.isSame(end, 'day') ||
      day.isBetween(start, end, 'day', '[]'));

  return (
    <CustomPickersDay
      {...other}
      day={day}
      selected={isSelected}
      ownerState={{ isDark }}
    />
  );
}

export default function MultiDateRangePicker({ onRangeSelect, theme }) {
  const [startDay, setStartDay] = React.useState(null);
  const [endDay, setEndDay] = React.useState(null);
  const isDark = theme === 'dark';

  const generateSelectedRange = () => {
    if (!startDay || !endDay) return [];
    const range = [];
    let current = startDay;

    while (current.isBefore(endDay) || current.isSame(endDay)) {
      range.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }
    return range;
  };

  const handleSelect = day => {
    if (!startDay) {
      setStartDay(day);
    } else if (!endDay) {
      if (day.isBefore(startDay)) setStartDay(day);
      else setEndDay(day);
    } else {
      setStartDay(day);
      setEndDay(null);
    }
  };

  const handleConfirm = () => {
    const range = generateSelectedRange();
    onRangeSelect(range);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div
        className={`flex flex-col items-center p-2 rounded-xl ${
          isDark ? 'bg-[#000000] text-white' : 'bg-white text-black'
        }`}
      >
        <DateCalendar
          value={startDay}
          onChange={handleSelect}
          slots={{ day: DayRange }}
          slotProps={{
            day: {
              start: startDay,
              end: endDay,
              isDark,
            },
          }}
          sx={{
            color: isDark ? '#ffffff' : '#000000',
            '& .MuiPickersCalendarHeader-label': {
              color: isDark ? '#ffffff' : '#000000',
            },
            '& .MuiSvgIcon-root': {
              color: isDark ? '#ffffff' : '#000000',
            },
            '& .MuiDayCalendar-weekDayLabel': {
              color: isDark ? '#bbbbbb' : '#666666',
            },
          }}
        />

        {/* OK Button */}
        <button
          onClick={handleConfirm}
          disabled={!startDay || !endDay}
          className={`mt-1 mb-3 px-5 py-2 rounded-lg font-medium text-white transition ${
            !startDay || !endDay
              ? 'bg-gray-500 cursor-not-allowed'
              : isDark
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-[#ED1C24] hover:bg-[#b3161a]'
          }`}
        >
          OK
        </button>
      </div>
    </LocalizationProvider>
  );
}
