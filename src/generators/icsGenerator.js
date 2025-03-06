/**
 * ICS Generator Module
 *
 * [EN]
 * This module is responsible for generating ICS calendar files from timetable data.
 * The ICS format is a standard format for calendar data exchange and can be imported
 * into most calendar applications like Google Calendar, Apple Calendar, Outlook, etc.
 *
 * [AL]
 * Ky modul eshte pergjegjes per gjenerimin e skedareve te kalendarit ICS nga te dhenat e orarit.
 * Formati ICS eshte nje format standart per shkembimin e te dhenave te kalendarit dhe mund te importohet
 * ne shumicen e aplikacioneve te kalendarit si Google Calendar, Apple Calendar, Outlook, etj.
 */

const fs = require('fs');
const chalk = require('chalk');
const { generateUUID, dayToDate } = require('../utils/utils');

/**
 * Creates an ICS file from timetable data
 * @param {Object} timetableData - Object containing lecture data grouped by day
 * @param {string} paraleli - The class identifier (e.g., 'A2', 'B1'.. etc)
 * @param {number} semester - The semester number (1 or 2), affects the end date of recurring events
 */

function createICS(timetableData, emriDeges, paraleli, viti, semester) {
  // Current timestamp in iCalendar format (used for DTSTAMP)
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let untilDate;

  // Initialize ICS content with required calendar properties
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//School Calendar//EN',
    'X-WR-CALNAME:Orari',
    'X-WR-TIMEZONE:Europe/Tirane',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Track event counts for reporting
  let totalEvents = 0;
  let daysProcessed = 0;

  // Process each day's lectures
  for (const day in timetableData) {
    daysProcessed++;
    const dayEvents = timetableData[day];

    // Map Albanian day names to English for dayToDate function
    // This is necessary because the timetable data uses Albanian day names,
    // but we need English day names for date calculations
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
        console.log(
          chalk.yellow('⚠️ ') +
            chalk.yellow(`Dita e panjohur: ${day}, po anashkalohet...`)
        );
        continue;
    }

    // Get the date for this day in the current week
    const baseDate = dayToDate(englishDay);

    // Process each time slot in this day
    dayEvents.forEach((timeSlot) => {
      // Validate time format to prevent errors
      if (
        !timeSlot.start ||
        !timeSlot.end ||
        !timeSlot.start.includes(':') ||
        !timeSlot.end.includes(':')
      ) {
        console.log(
          chalk.yellow('⚠️ ') +
            chalk.yellow(
              `Format i pavlefshem kohe per ${day}: ${timeSlot.start}-${timeSlot.end}, po anashkalohet...`
            )
        );
        return;
      }

      // Process each lecture in the time slot
      // (A time slot can have multiple lectures, e.g., for split classes)
      timeSlot.lectures.forEach((lecture) => {
        try {
          // Create start and end dates for this lecture based on the day and time
          const startDate = new Date(baseDate);
          const endDate = new Date(baseDate);

          // Parse the start and end times
          const startParts = timeSlot.start.split(':');
          const endParts = timeSlot.end.split(':');

          // Validate time format
          if (startParts.length !== 2 || endParts.length !== 2) {
            console.log(
              chalk.yellow('⚠️ ') +
                chalk.yellow(
                  `Format i pavlefshem kohe per ${
                    lecture.subject || 'leksion'
                  }: ${timeSlot.start}-${timeSlot.end}, po anashkalohet...`
                )
            );
            return;
          }

          // Convert time strings to numbers
          const startHours = parseInt(startParts[0], 10);
          const startMinutes = parseInt(startParts[1], 10);
          const endHours = parseInt(endParts[0], 10);
          const endMinutes = parseInt(endParts[1], 10);

          // Validate time values are within valid ranges
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
            console.log(
              chalk.yellow('⚠️ ') +
                chalk.yellow(
                  `Vlerat e kohes te pavlefshme per ${
                    lecture.subject || 'leksion'
                  }: ${timeSlot.start}-${timeSlot.end}, po anashkalohet...`
                )
            );
            return;
          }

          // Set the hours and minutes on the date objects
          startDate.setHours(startHours, startMinutes, 0);
          endDate.setHours(endHours, endMinutes, 0);

          // Generate a unique ID for this event
          const uniqueId = generateUUID();

          // Format dates in iCalendar format (yyyyMMddTHHmmssZ)
          const dtstart =
            startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const dtend =
            endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          // Get the current month to determine academic year
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          // If we're in the second half of the academic year (Jan-Aug), use this year
          // Otherwise (Sep-Dec), assume we need the next year for end dates
          const academicYear = currentMonth < 8 ? currentYear : currentYear + 1;

          // Set the end date for recurring events based on the semester
          if (semester === 1) {
            // First semester ends in February
            untilDate = new Date(academicYear, 1, 15);
          } else {
            // Second semester ends in June
            untilDate = new Date(academicYear, 5, 15);
          }

          const untilStr =
            untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          // Create event description with professor information and email
          const description = `Nga ${
            lecture.professor
          }\ne-mail: ${lecture.professor
            .toLowerCase()
            .replace(' ', '.')}@fshn.edu.al`;
          const escapedDescription = description.replace(/\n/g, '\\n');

          // Escape special characters in subject and location fields
          // This is necessary for iCalendar compatibility
          const escapedSubject = (lecture.subject || 'Unnamed Lecture').replace(
            /[,;\\]/g,
            '\\$&'
          );
          const escapedLocation = (lecture.class || 'Unknown Location').replace(
            /[,;\\]/g,
            '\\$&'
          );

          // Add the event to the ICS content
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

          // Increment event count
          totalEvents++;
        } catch (err) {
          // Log any errors that occur during event creation
          console.log(
            chalk.red('❌ ') +
              chalk.red(
                `Gabim gjate krijimit te eventit per ${
                  lecture.subject || 'leksion i panjohur'
                }: ${err.message}`
              )
          );
        }
      });
    });
  }

  // End the calendar content
  icsContent.push('END:VCALENDAR');

  // Create output directory if it doesn't exist
  if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
    console.log(
      chalk.green('📁 ') + chalk.green('Direktoria output u krijua.')
    );
  }

  // Generate filename
  const filename = `orari_${emriDeges
    .toLowerCase()
    .split(' ')
    .join('_')}_${paraleli}_viti_${viti}.ics`;

  // Write the ICS file
  fs.writeFileSync(`output/${filename}`, icsContent.join('\r\n'), 'utf8');

  // Show success message with file details
  console.log(
    chalk.green('✅ ') +
      chalk.green(`Orari u krijua me sukses: `) +
      chalk.greenBright.bold(`output/${filename}`)
  );

  // Show summary of processed data
  console.log(
    chalk.blue('📊 ') +
      chalk.blue(
        `Permbledhje: ${totalEvents} evente u shtuan ne kalendar nga ${daysProcessed} dite te javes.`
      )
  );

  // Add a reminder about importing
  console.log(
    chalk.magenta('💡 ') +
      chalk.magenta(
        `Keshille: Importoni skedarin ne aplikacionin tuaj te kalendarit per te pare orarin.`
      )
  );
}

module.exports = { createICS };
