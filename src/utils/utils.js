function dayToDate(dayName) {
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  let difference = dayMap[dayName] - currentDay;
  if (difference < 0) difference += 7;
  currentDate.setDate(currentDate.getDate() + difference);
  return currentDate;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

module.exports = { dayToDate, generateUUID };
