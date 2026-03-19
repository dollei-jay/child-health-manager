export const getWeekDates = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${date}`);
  }
  return dates;
};

export const getMonthDates = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates = [];

  let startDay = firstDay.getDay();
  if (startDay === 0) startDay = 7;
  
  for (let i = startDay - 1; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    dates.push({ date: `${y}-${m}-${dt}`, isCurrentMonth: false, day: d.getDate() });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    dates.push({ date: `${y}-${m}-${dt}`, isCurrentMonth: true, day: d.getDate() });
  }

  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    dates.push({ date: `${y}-${m}-${dt}`, isCurrentMonth: false, day: d.getDate() });
  }

  return dates;
};
