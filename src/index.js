// Import inquirer correctly
const { default: inquirer } = require('inquirer');
const { fetchAndPrintTimetable } = require('./api/fetchTimetable.js');
const {
  degaOptions,
  vitiOptions,
  paraleliOptions,
  semesterOptions,
} = require('./data.js');

async function main() {
  try {
    // Prompt for Dega
    const { dega } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dega',
        message: 'Zgjidhni Degen:',
        choices: degaOptions.map((option, index) => ({
          name: `${index + 1}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Prompt for Viti
    const { viti } = await inquirer.prompt([
      {
        type: 'list',
        name: 'viti',
        message: 'Zgjidhni Vitin:',
        choices: vitiOptions.map((option, index) => ({
          name: `${index + 1}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Prompt for Paraleli
    const { paraleli } = await inquirer.prompt([
      {
        type: 'list',
        name: 'paraleli',
        message: 'Zgjidhni Paralelin:',
        choices: paraleliOptions.map((option, index) => ({
          name: `${index + 1}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    const { semester } = await inquirer.prompt([
      {
        type: 'list',
        name: 'semester',
        message: 'Zgjidhni Semestrin:',
        choices: semesterOptions.map((option, index) => ({
          name: `${index + 1}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Call the function with user inputs
    fetchAndPrintTimetable(dega, viti, paraleli, semester);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
