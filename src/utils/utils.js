/**
 * [EN]
 * Converts a day name to the next occurrence of that day's date
 *
 * Given a day name (e.g., 'Monday'), this function calculates the date of
 * the next occurrence of that day from the current date. If today is the
 * specified day, it returns today's date. If today is after the specified
 * day in the week, it returns the date for next week's occurrence.
 *
 * [AL]
 * Konverton emrin e nje dite ne daten e ardhshme te asaj dite
 *
 * Duke dhene emrin e nje dite (p.sh., 'E Hene'), kjo funksion llogarit daten
 * e ardhshme te ndodhjes se asaj dite nga data aktuale. Nese sot eshte dita
 * e specifikuar, kthen daten e sotme. Nese sot eshte pas dites se specifikuar
 * ne jave, kthen daten per ndodhjen e javes se ardhshme.
 *
 * @param {string} dayName - The name of the day (Monday, Tuesday, etc.)
 * @returns {Date} Date object representing the next occurrence of the specified day
 */

function dayToDate(dayName) {
  // Map day names to their corresponding day numbers (1 = Monday, 2 = Tuesday, etc.)
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  // Get the current date
  const currentDate = new Date();

  // Get the current day number (0 = Sunday, 1 = Monday, etc.)
  const currentDay = currentDate.getDay();

  // Calculate the difference between the target day and the current day
  let difference = dayMap[dayName] - currentDay;

  // If the difference is negative, it means the day has already passed this week,
  // so add 7 to get the day in the next week
  if (difference < 0) difference += 7;

  // Advance the current date by the calculated difference
  currentDate.setDate(currentDate.getDate() + difference);

  return currentDate;
}

/**
 * Generates a random UUID (Universally Unique Identifier)
 *
 * This implementation follows the UUID v4 format, which uses random numbers.
 * The format is: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, where:
 * - 'x' represents any hexadecimal digit (0-9, a-f)
 * - '4' is fixed to indicate UUID version 4
 * - 'y' represents a digit that's constrained by the UUID variant (8, 9, a, or b)
 *
 * @returns {string} A randomly generated UUID v4 string
 */

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // Generate a random number (0-15)
    const r = (Math.random() * 16) | 0;

    // For 'x', use the random number; for 'y', use bits 0-1 of the random number OR'd with 0x8
    // This ensures the UUID variant is correct (RFC 4122)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

module.exports = { dayToDate, generateUUID };
