const readlineSync = require('readline-sync');
const { runCommand, validateUncommittedChanges } = require('./utils');
const fs = require('node:fs').promises;

const pkg = require('../package.json');

main()
  .then(() => console.log('Script execution complete.'))
  .catch((error) => console.error(`Error: ${error.message}`))
  .finally(() => process.exit(0));

async function main() {
  await validateUncommittedChanges();
  await initializePackage();
  await updateReadme();

  await runCommand('rm CHANGELOG.md');
  await runCommand('npm install');
  await runCommand('git add .');
  await runCommand('git commit -m "chore: :tada: initialize project"');

  console.log('Project initialized successfully.');

  if (readlineSync.keyInYN('Would you like to push the changes to the remote repository?')) {
    await runCommand('git push');
    return;
  }

  console.log('Please run the following commands to push the changes:');
  console.log('git push');
}

async function initializePackage() {
  console.log('Please answer the following questions to set up your package.json file.');
  const gitUrl = await runCommand('git config --get remote.origin.url');
  const gitUserName = await runCommand('git config --get user.name');
  const gitUserEmail = await runCommand('git config --get user.email');

  pkg.name = getUserInput('Package name', pkg.name);
  pkg.description = getUserInput('\nDescription');
  pkg.version = '0.0.0';
  pkg.repository = {
    type: 'git',
    url: gitUrl,
  };
  pkg.homepage = getUserInput('\nHomepage', gitUrl.replace(/\.git$/, ''));
  pkg.author = {
    name: getUserInput('\nAuthor name', gitUserName),
    email: getUserInput('\nAuthor email', gitUserEmail),
    url: getUserInput('\nAuthor url', `https://github.com/${gitUserName}`),
  };

  delete pkg.scripts['quickstart'];
  await runCommand('rm -rf ./scripts/quickstart.js');

  await fs.writeFile('./package.json', JSON.stringify(pkg, null, 2));
  console.log('Updated package.json file.');
}

async function updateReadme() {
  const readmePath = './README.md';

  const readmeContent = `# ${pkg.name}\n\n${
    pkg.description ? `${pkg.description}\n` : ''
  }\n\n---\n\n${
    pkg.author
      ? `Author: [${pkg.author.name}](${pkg.author.url || `mailto:${pkg.author.email}`})`
      : ''
  }\n\n${
    pkg.homepage ? `Homepage: ${pkg.homepage}` : ''
  }\n\nCopyright © ${new Date().getFullYear()} All Rights Reserved.\n\n---\n\nAuto-generated by [nextjs-twin.macro-styled-components-storybook](https://github.com/hussam-aldarwish/nextjs-twin.macro-styled-components-storybook)
  `;

  await fs.writeFile(readmePath, readmeContent);
  console.log('Updated README.md file.');
}

function getUserInput(question, defaultValue = '') {
  return readlineSync.question(`${question}? :`, {
    defaultInput: defaultValue,
  });
}
