/**
 * Main entry point for the FSHN Timetable Application
 */
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

function displayHeader() {
  console.clear();

  const title = figlet.textSync('Orari-FSHN', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });
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
    const selectedDega = degaOptions.find(
      (option) => option.value === degaValue
    );
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

main();
