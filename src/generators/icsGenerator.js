// src/generators/icsGenerator.js
const fs = require('fs');
const { generateUUID, dayToDate } = require('../utils/utils');

function createICS(timetableData, paraleli, semester) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let untilDate;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//School Calendar//EN',
    'X-WR-CALNAME:Orari',
    'X-WR-TIMEZONE:Europe/Tirane',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Process each day's lectures
  for (const day in timetableData) {
    const dayEvents = timetableData[day];

    // Map day names to English for dayToDate function
    let englishDay;
    switch (day) {
      case 'E Hene':
        englishDay = 'Monday';
        break;
      case 'E Marte':
        englishDay = 'Tuesday';
        break;
      case 'E Merkure':
        englishDay = 'Wednesday';
        break;
      case 'E Enjte':
        englishDay = 'Thursday';
        break;
      case 'E Premte':
        englishDay = 'Friday';
        break;
      default:
        console.warn(`Unknown day: ${day}, skipping...`);
        continue;
    }

    const baseDate = dayToDate(englishDay);

    dayEvents.forEach((timeSlot) => {
      // Validate time format
      if (
        !timeSlot.start ||
        !timeSlot.end ||
        !timeSlot.start.includes(':') ||
        !timeSlot.end.includes(':')
      ) {
        console.warn(
          `Invalid time format for ${day} event: ${timeSlot.start}-${timeSlot.end}, skipping...`
        );
        return;
      }

      // Process each lecture in the time slot
      timeSlot.lectures.forEach((lecture) => {
        try {
          const startDate = new Date(baseDate);
          const endDate = new Date(baseDate);

          // Set hours and minutes from the time strings with validation
          const startParts = timeSlot.start.split(':');
          const endParts = timeSlot.end.split(':');

          if (startParts.length !== 2 || endParts.length !== 2) {
            console.warn(
              `Invalid time format for ${lecture.subject}: ${timeSlot.start}-${timeSlot.end}, skipping...`
            );
            return;
          }

          const startHours = parseInt(startParts[0], 10);
          const startMinutes = parseInt(startParts[1], 10);
          const endHours = parseInt(endParts[0], 10);
          const endMinutes = parseInt(endParts[1], 10);

          // Validate time values
          if (
            isNaN(startHours) ||
            isNaN(startMinutes) ||
            isNaN(endHours) ||
            isNaN(endMinutes) ||
            startHours < 0 ||
            startHours > 23 ||
            startMinutes < 0 ||
            startMinutes > 59 ||
            endHours < 0 ||
            endHours > 23 ||
            endMinutes < 0 ||
            endMinutes > 59
          ) {
            console.warn(
              `Invalid time values for ${lecture.subject}: ${timeSlot.start}-${timeSlot.end}, skipping...`
            );
            return;
          }

          startDate.setHours(startHours, startMinutes, 0);
          endDate.setHours(endHours, endMinutes, 0);

          const uniqueId = generateUUID();

          // Format dates for ICS
          const dtstart =
            startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const dtend =
            endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          // if Semestri 1 set end date for recurring events (Feb 15, currentYear + 1), else set end date for recurring events (Jun 15, currentYear)
          if (semester === 1) {
            untilDate = new Date(new Date().getFullYear(), 1, 15);
          } else {
            untilDate = new Date(new Date().getFullYear(), 6, 15);
          }
          const untilStr =
            untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          // Create event description with proper escaping
          const description = `Nga ${
            lecture.professor
          }\ne-mail: ${lecture.professor
            .toLowerCase()
            .replace(' ', '.')}@fshn.edu.al`;
          const escapedDescription = description.replace(/\n/g, '\\n');

          // Escape any special characters in subject field
          const escapedSubject = (lecture.subject || 'Unnamed Lecture').replace(
            /[,;\\]/g,
            '\\$&'
          );
          const escapedLocation = (lecture.class || 'Unknown Location').replace(
            /[,;\\]/g,
            '\\$&'
          );

          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uniqueId}`,
            `DTSTAMP:${now}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `SUMMARY:${escapedSubject}`,
            `LOCATION:${escapedLocation}`,
            `DESCRIPTION:${escapedDescription}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'END:VEVENT'
          );
        } catch (err) {
          console.error(
            `Error gjate krijimit te eventit per ${
              lecture.subject || 'Unknown'
            }: ${err.message}`
          );
        }
      });
    });
  }

  icsContent.push('END:VCALENDAR');

  // Make sure the output directory exists
  if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
  }

  fs.writeFileSync(
    `output/Orari_${paraleli}.ics`,
    icsContent.join('\r\n'),
    'utf8'
  );
  console.log(`ICS file created successfully: output/Orari_${paraleli}.ics`);
}

module.exports = { createICS };
