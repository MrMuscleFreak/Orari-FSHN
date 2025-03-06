/**
 * Main entry point for the FSHN Timetable Application
 */

// Import required libraries and modules
const { default: inquirer } = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const { fetchAndPrintTimetable } = require('./api/fetchTimetable.js');
const {
  degaOptions,
  vitiOptions,
  paraleliOptions,
  semesterOptions,
} = require('./data.js');

/**
 * Display a stylish ASCII art header with the app name
 */
function displayHeader() {
  console.clear();

  const title = figlet.textSync('Orari-FSHN', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  // Create gradient for the title
  console.log(gradient.vice.multiline(title));

  console.log('\n' + chalk.cyan('Orari i Fakultetit te Shkencave te Natyres'));
  console.log(chalk.dim('Created by: github.com/MrMuscleFreak\n'));
}

/**
 * Main application function
 */
async function main() {
  try {
    displayHeader();

    console.log(
      chalk.yellowBright('📚 Zgjidhni opsionet per te krijuar orarin:')
    );

    // Prompt user to select a department
    const { dega: degaValue } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dega',
        message: chalk.green('Zgjidhni Degen:'),
        choices: degaOptions.map((option, index) => ({
          name: `${chalk.cyan(index + 1)}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Find the full option object based on the selected value
    const selectedDega = degaOptions.find(
      (option) => option.value === degaValue
    );

    // Prompt user to select a year
    const { viti } = await inquirer.prompt([
      {
        type: 'list',
        name: 'viti',
        message: chalk.green('Zgjidhni Vitin:'),
        choices: vitiOptions.map((option, index) => ({
          name: `${chalk.cyan(index + 1)}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Prompt user to select a class section
    const { paraleli } = await inquirer.prompt([
      {
        type: 'list',
        name: 'paraleli',
        message: chalk.green('Zgjidhni Paralelin:'),
        choices: paraleliOptions.map((option, index) => ({
          name: `${chalk.cyan(index + 1)}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    // Prompt user to select a semester
    const { semester } = await inquirer.prompt([
      {
        type: 'list',
        name: 'semester',
        message: chalk.green('Zgjidhni Semestrin:'),
        choices: semesterOptions.map((option, index) => ({
          name: `${chalk.cyan(index + 1)}. ${option.name}`,
          value: option.value,
        })),
      },
    ]);

    console.log('\n' + chalk.yellowBright('🔍 Duke kerkuar orarin...'));

    // Call the function with user inputs
    fetchAndPrintTimetable(
      selectedDega.value,
      selectedDega.name,
      viti,
      paraleli,
      semester
    );
  } catch (error) {
    console.error(chalk.red('❌ Gabim:'), error);
  }
}

// Execute the main function to start the application
main();
