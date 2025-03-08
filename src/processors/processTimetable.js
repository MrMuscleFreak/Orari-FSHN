/**
 * Parses HTML content of a timetable and extracts lecture information
 * @param {string} html - The HTML content containing the timetable
 * @returns {Array} An array of lecture objects with day, time, and lecture details
 */

function parseTimetableText(html) {
  const dayNames = ['E Hene', 'E Marte', 'E Merkure', 'E Enjte', 'E Premte'];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const lectures = [];

  rowMatches.slice(1).forEach((row) => {
    const timeMatch = row.match(/<th[^>]*>(.*?)<\/th>/i);
    const time = timeMatch ? timeMatch[1].trim() : '';
    const tdMatches = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];

    tdMatches.forEach((cell, j) => {
      const cellContent = cell.replace(/<[^>]*>/g, '').trim();
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
  const grouped = {};

  // Parse the time string into start and end times
  const parsedLectures = lectures.map((item) => {
    let start = '';
    let end = '';
    if (item.time) {
      const parts = item.time.split('-');
      if (parts.length === 2) {
        start = parts[0].trim();
        end = parts[1].trim();
      }
    }
    return { day: item.day, start, end, lecture: item.lecture };
  });

  // Group lectures by day of the week
  parsedLectures.forEach((item) => {
    if (!grouped[item.day]) {
      grouped[item.day] = [];
    }
    grouped[item.day].push(item);
  });

  for (const day in grouped) {
    const merged = [];

    // Merge consecutive lectures if they have the same subject and are contiguous in time.
    grouped[day].forEach((item) => {
      if (merged.length > 0) {
        const last = merged[merged.length - 1];
        if (
          last.lecture === item.lecture &&
          last.lecture !== '' &&
          last.end === item.start
        ) {
          last.end = item.end;
          return;
        }
      }
      merged.push(item);
    });

    // Process each merged lecture to extract detailed information
    grouped[day] = merged
      .filter((item) => item.lecture !== '')
      .map((item) => {
        const parts = item.lecture.split('|').map((s) => s.trim());
        let lecturesArray = [];

        if (parts.length % 4 === 0) {
          for (let i = 0; i < parts.length; i += 4) {
            lecturesArray.push({
              subject: parts[i],
              type: parts[i + 1],
              professor: parts[i + 2],
              class: parts[i + 3],
            });
          }
        }
        // Special case: exactly 7 parts indicates two lectures where the first one's
        // (e.g., "Analize numerike | Leksion | Fatmir Hoxha | Salla (301B) GIS | Leksion | Ilma Lili | Salla (401B)")
        else if (parts.length === 7) {
          const clazz = parts[3];
          const pos = clazz.indexOf(')');
          if (pos !== -1 && pos < clazz.length - 1) {
            const firstClass = clazz.substring(0, pos + 1).trim();
            const secondSubject = clazz.substring(pos + 1).trim();

            lecturesArray.push({
              subject: parts[0],
              type: parts[1],
              professor: parts[2],
              class: firstClass,
            });

            lecturesArray.push({
              subject: secondSubject,
              type: parts[4],
              professor: parts[5],
              class: parts[6],
            });
          } else {
            lecturesArray.push({
              subject: item.lecture,
              type: '',
              professor: '',
              class: '',
            });
          }
        } else {
          lecturesArray.push({
            subject: item.lecture,
            type: '',
            professor: '',
            class: '',
          });
        }

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
  const timetableStart = html.indexOf('E Hënë');
  const cleanTimetable =
    timetableStart === -1
      ? html // If the timetable doesn't contain days, use the whole HTML
      : html.slice(html.lastIndexOf('<tr', timetableStart));

  const lectures = parseTimetableText(cleanTimetable);
  return groupLecturesByDay(lectures);
}

module.exports = { processTimetable };
