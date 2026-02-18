export const formatCurrency = (value: number, decimals: number = 0) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatShortDate = (value: string | Date) => {
  const d = new Date(value);
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  
  return `${day} ${month} ${year}`;
};

export const formatFullDate = (value: string | Date) => {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};