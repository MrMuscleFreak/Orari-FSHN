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

  let totalEvents = 0;
  let daysProcessed = 0;

  for (const day in timetableData) {
    daysProcessed++;
    const dayEvents = timetableData[day];

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

    const baseDate = dayToDate(englishDay);

    // Process each time slot in this day
    dayEvents.forEach((timeSlot) => {
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
      // (A time slot can have multiple lectures, for split classes)
      timeSlot.lectures.forEach((lecture) => {
        try {
          const startDate = new Date(baseDate);
          const endDate = new Date(baseDate);

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

          const startHours = parseInt(startParts[0], 10);
          const startMinutes = parseInt(startParts[1], 10);
          const endHours = parseInt(endParts[0], 10);
          const endMinutes = parseInt(endParts[1], 10);

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

          startDate.setHours(startHours, startMinutes, 0);
          endDate.setHours(endHours, endMinutes, 0);

          const uniqueId = generateUUID();

          const dtstart =
            startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const dtend =
            endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const academicYear = currentMonth < 8 ? currentYear : currentYear + 1;

          // Set the end date for recurring events based on the semester
          if (semester === 1) {
            untilDate = new Date(academicYear, 1, 15);
          } else {
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
          const escapedSubject = (
            `${lecture.subject} - ${lecture.type}` || 'Unnamed Lecture'
          ).replace(/[,;\\]/g, '\\$&');
          const escapedLocation = (lecture.class || 'Unknown Class').replace(
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

          totalEvents++;
        } catch (err) {
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

  icsContent.push('END:VCALENDAR');

  if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
    console.log(
      chalk.green('📁 ') + chalk.green('Direktoria output u krijua.')
    );
  }

  const filename = `orari_${emriDeges
    .toLowerCase()
    .split(' ')
    .join('_')}_${paraleli}_viti_${viti}.ics`;

  fs.writeFileSync(`output/${filename}`, icsContent.join('\r\n'), 'utf8');

  console.log(
    chalk.green('✅ ') +
      chalk.green(`Orari u krijua me sukses: `) +
      chalk.greenBright.bold(`output/${filename}`)
  );
  console.log(
    chalk.blue('📊 ') +
      chalk.blue(
        `Permbledhje: ${totalEvents} evente u shtuan ne kalendar nga ${daysProcessed} dite te javes.`
      )
  );
  console.log(
    chalk.magenta('💡 ') +
      chalk.magenta(
        `Keshille: Importoni skedarin ne aplikacionin tuaj te kalendarit per te pare orarin.`
      )
  );
}

module.exports = { createICS };
