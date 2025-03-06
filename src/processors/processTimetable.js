/**
 * Parses HTML content of a timetable and extracts lecture information
 * @param {string} html - The HTML content containing the timetable
 * @returns {Array} An array of lecture objects with day, time, and lecture details
 */

function parseTimetableText(html) {
  // Define the days of the week in Albanian
  const dayNames = ['E Hene', 'E Marte', 'E Merkure', 'E Enjte', 'E Premte'];
  // Extract all table rows from the HTML
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  // Initialize the array to store lecture information
  const lectures = [];

  // Skip the header row (slice(1)) and process each row
  rowMatches.slice(1).forEach((row) => {
    // Extract time information from the first column (th element)
    const timeMatch = row.match(/<th[^>]*>(.*?)<\/th>/i);
    const time = timeMatch ? timeMatch[1].trim() : '';
    // Extract all data cells (td elements) from this row
    const tdMatches = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];

    // Process each cell (representing a day)
    tdMatches.forEach((cell, j) => {
      // Remove HTML tags and trim whitespace
      const cellContent = cell.replace(/<[^>]*>/g, '').trim();
      // Check if the cell is empty (contains &nbsp; or is blank)
      const isEmpty = cell.indexOf('&nbsp') !== -1 || cellContent === '';

      // Only process non-empty cells
      if (!isEmpty) {
        lectures.push({
          day: dayNames[j],
          time,
          lecture: cellContent,
        });
      }
    });
  });

  return lectures;
}

/**
 * Groups lectures by day and processes them into a structured format
 * @param {Array} lectures - Array of raw lecture objects from parseTimetableText
 * @returns {Object} An object with days as keys and arrays of structured lecture objects as values
 */

function groupLecturesByDay(lectures) {
  // Initialize the result object
  const grouped = {};

  // Parse the time string into start and end times
  const parsedLectures = lectures.map((item) => {
    let start = '';
    let end = '';
    if (item.time) {
      // Split time range (e.g., "08:00-09:00") into start and end times
      const parts = item.time.split('-');
      if (parts.length === 2) {
        start = parts[0].trim();
        end = parts[1].trim();
      }
    }
    // Return restructured object with separate start and end times
    return { day: item.day, start, end, lecture: item.lecture };
  });

  // Group lectures by day of the week
  parsedLectures.forEach((item) => {
    // Initialize array for this day if it doesn't exist yet
    if (!grouped[item.day]) {
      grouped[item.day] = [];
    }
    grouped[item.day].push(item);
  });

  // Process each day's lectures
  for (const day in grouped) {
    const merged = [];

    // Merge consecutive lectures if they have the same subject and are contiguous in time.
    grouped[day].forEach((item) => {
      // If this is the first item or can't be merged, just add it
      if (merged.length > 0) {
        const last = merged[merged.length - 1];
        // Check if this lecture can be merged with the previous one
        if (
          last.lecture === item.lecture &&
          last.lecture !== '' &&
          last.end === item.start
        ) {
          // Merge by extending the end time of the previous lecture
          last.end = item.end;
          return; // Skip adding this item separately
        }
      }
      merged.push(item);
    });

    // Process each merged lecture to extract detailed information
    grouped[day] = merged
      .filter((item) => item.lecture !== '') // Skip empty lectures
      .map((item) => {
        // Split the lecture string by pipe character to get individual fields
        const parts = item.lecture.split('|').map((s) => s.trim());
        let lecturesArray = [];

        // Standard case: 4 fields per lecture (subject, type, professor, class)
        if (parts.length % 4 === 0) {
          // Process each set of 4 parts as a separate lecture
          for (let i = 0; i < parts.length; i += 4) {
            lecturesArray.push({
              subject: parts[i],
              type: parts[i + 1], // Lecture type (e.g., "Leksion | Seminar")
              professor: parts[i + 2],
              class: parts[i + 3],
            });
          }
        }
        // Special case: exactly 7 parts indicates two lectures where the first one's
        // (e.g., "Analize numerike | Leksion | Fatmir Hoxha | Salla (301B) GIS | Leksion | Ilma Lili | Salla (401B)")
        // class information contains part of the second lecture's subject
        else if (parts.length === 7) {
          const clazz = parts[3];
          // Look for a closing parenthesis to split the information
          const pos = clazz.indexOf(')');
          if (pos !== -1 && pos < clazz.length - 1) {
            // Extract the first lecture's classroom (up to and including the ')')
            const firstClass = clazz.substring(0, pos + 1).trim();
            // Extract the second lecture's subject (after the ')')
            const secondSubject = clazz.substring(pos + 1).trim();

            // Add the first lecture
            lecturesArray.push({
              subject: parts[0],
              type: parts[1],
              professor: parts[2],
              class: firstClass,
            });

            // Add the second lecture
            lecturesArray.push({
              subject: secondSubject,
              type: parts[4],
              professor: parts[5],
              class: parts[6],
            });
          } else {
            // Fallback if no proper split can be done
            lecturesArray.push({
              subject: item.lecture,
              type: '',
              professor: '',
              class: '',
            });
          }
        } else {
          // Fallback for any other unexpected format
          lecturesArray.push({
            subject: item.lecture,
            type: '',
            professor: '',
            class: '',
          });
        }

        // Return the final structured lecture object
        return {
          start: item.start,
          end: item.end,
          lectures: lecturesArray,
        };
      });
  }

  return grouped;
}

/**
 * Main function to process timetable HTML into structured data
 * @param {string} html - The raw HTML content of the timetable
 * @returns {Object} A structured object containing all timetable data grouped by day
 */
function processTimetable(html) {
  // Find the start of the actual timetable content (usually begins with the Monday header)
  const timetableStart = html.indexOf('E Hënë');
  const cleanTimetable =
    timetableStart === -1
      ? html // Use the whole HTML if timetable start marker not found
      : html.slice(html.lastIndexOf('<tr', timetableStart)); // Get from the table row containing the days

  // Parse the HTML into an array of lecture objects
  const lectures = parseTimetableText(cleanTimetable);
  // Process and group the lectures by day
  return groupLecturesByDay(lectures);
}

module.exports = { processTimetable };
