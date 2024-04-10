const { exec } = require('node:child_process');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.error(stderr);
      resolve(stdout.trim());
    });
  });
}

async function validateUncommittedChanges() {
  const hasUncommittedChanges = await runCommand('git status --porcelain');
  if (hasUncommittedChanges) {
    throw new Error('Uncommitted changes detected. Aborting.');
  }
}

module.exports = {
  runCommand,
  validateUncommittedChanges,
};
