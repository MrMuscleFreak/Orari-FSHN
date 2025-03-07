/**
 * API Module for fetching and processing timetable data
 *
 *[EN]
 * This module handles the HTTP request to the FSHN timetable server,
 * processes the HTML response, and generates an ICS calendar file.
 *
 * [AL]
 * Ky modul merret me kërkesën HTTP te serveri i orarit të FSHN,
 * proceson përgjigjen HTML dhe gjeneron një skedar kalendarik ICS.
 */

const { processTimetable } = require('../processors/processTimetable');
const { createICS } = require('../generators/icsGenerator');

/**
 * Fetches timetable data from the server and processes it
 *
 * This function makes a POST request to the FSHN timetable server with the
 * selected parameters, processes the returned HTML to extract structured data,
 * and generates an ICS file for calendar import.
 *
 * @param {string} dega - Department code (e.g., "inf", "mat")
 * @param {string} viti - Year of study (e.g., "1", "2", "3")
 * @param {string} paraleli - Class section (e.g., "A1", "B2")
 * @param {number} semester - Semester number (1 or 2), affects recurring event end dates
 * @returns {null} Returns null on error or if no data is found
 */
async function fetchAndPrintTimetable(
  dega,
  emriDeges,
  viti,
  paraleli,
  semester
) {
  try {
    const response = await fetch('http://37.139.119.36:81/orari/student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'http://37.139.119.36:81/orari/student',
      },
      body: `dega=${dega}&viti=${viti}&paraleli=${paraleli}&submit=Afisho`,
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const htmlResponse = await response.text();

    const timetableData = processTimetable(htmlResponse);

    if (Object.keys(timetableData).length === 0) {
      console.log(
        `Nuk u gjet asnje e dhene per ${dega} viti ${viti} ${paraleli}, kontrollo vitin/degen.`
      );
      return null;
    }

    createICS(timetableData, emriDeges, paraleli, viti, semester);
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = { fetchAndPrintTimetable };
