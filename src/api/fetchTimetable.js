// src/api/fetchTimetable.js
const { processTimetable } = require('../processors/processTimetable');
const { createICS } = require('../generators/icsGenerator');

async function fetchAndPrintTimetable(dega, viti, paraleli, semester) {
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
        `Nuk u gjet asnje e dhene per paralelin ${paraleli} te vitit ${viti}, kontrollo vitin/degen`
      );
      return null; // Return null or some indication that no data was found
    }
    createICS(timetableData, paraleli, semester);
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = { fetchAndPrintTimetable };
