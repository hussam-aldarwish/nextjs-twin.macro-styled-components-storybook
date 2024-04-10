const { inc } = require('semver');
const readlineSync = require('readline-sync');
const conventionalChangelog = require('conventional-changelog');
const { Writable } = require('node:stream');
const { parser, Changelog, Release } = require('keep-a-changelog');
const { readFileSync, writeFileSync } = require('node:fs');
const { runCommand, validateUncommittedChanges } = require('./utils');

async function main() {
  try {
    await validateUncommittedChanges();
    const branchName = await gitBranchName();

    switch (branchName) {
      case 'develop':
        await handleDevelopBranch();
        break;
      case 'main':
        await handleMainBranch();
        break;
      default:
        if (branchName.startsWith('hotfix/')) {
          await handleHotfixBranch(branchName);
        } else {
          throw new Error(
            `Error: Current branch is '${branchName}'. Please switch to 'main', 'develop', or 'hotfix/<name>' before proceeding.`,
          );
        }
    }

    console.log('Script execution complete.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

async function handleDevelopBranch() {
  const releaseType = promptUser(
    ['minor', 'major', 'preminor', 'premajor', 'prerelease'],
    'Select the release type:',
  );

  const preReleaseIdentifier = releaseType.startsWith('pre')
    ? promptUser(['alpha', 'beta', 'rc'], 'Select the pre-release identifier:')
    : null;

  const newVersion = getNewVersion(releaseType, preReleaseIdentifier);

  console.log(`Starting release process for version v${newVersion}...`);
  await runGitFlowCommand(`release start v${newVersion}`);

  await bumpVersion(newVersion);
  await generateChangelog(newVersion);
  await commitChanges(newVersion);

  console.log(`Finishing release process for version v${newVersion}...`);
  await runGitFlowCommand(`release finish v${newVersion} -m "Release v${newVersion}"`);

  console.log(`Release process for version v${newVersion} complete!`);
  await pushChanges();
}

async function handleMainBranch() {
  const releaseType = promptUser(
    ['patch', 'prepatch', 'prerelease'],
    'Select the hotfix release type:',
  );

  const preReleaseIdentifier = releaseType.startsWith('pre')
    ? promptUser(['alpha', 'beta', 'rc'], 'Select the pre-release identifier:')
    : null;

  const newVersion = getNewVersion(releaseType, preReleaseIdentifier);

  console.log(`Starting hotfix release process for version v${newVersion}...`);
  await runGitFlowCommand(`hotfix start v${newVersion}`);
}

async function handleHotfixBranch(branchName) {
  const newVersion = branchName.replace('hotfix/v', '');

  await bumpVersion(newVersion);
  await generateChangelog(newVersion);
  await commitChanges(newVersion);

  console.log('Finishing hotfix release process...');
  await runGitFlowCommand(`hotfix finish v${newVersion} -m "v${newVersion}"`);
  await pushChanges();
}

function getNewVersion(releaseType, preReleaseIdentifier) {
  const currentVersion = require('../package.json').version;
  return inc(currentVersion, releaseType, preReleaseIdentifier);
}

async function bumpVersion(newVersion) {
  console.log(`Bumping version to v${newVersion}...`);
  await runNpmVersionCommand(`${newVersion} --no-git-tag-version`);
}

async function generateChangelog(newVersion) {
  return new Promise((resolve, reject) => {
    console.log('Generating changelog...');
    const customStream = new WriteStream();
    conventionalChangelog({
      releaseCount: 1,
    })
      .on('error', reject)
      .pipe(customStream)
      .on('finish', async () => {
        await runNpxChangelogCommand(`--release ${newVersion}`);
        resolve();
      });
  });
}

async function commitChanges(newVersion) {
  console.log('Committing changes...');
  await runGitCommand('add package.json package-lock.json CHANGELOG.md');
  await runGitCommand(
    `commit -m "chore(release): :bookmark: bump version to v${newVersion} and update CHANGELOG.md"`,
  );
}

async function pushChanges() {
  console.log('Pushing changes...');
  if (readlineSync.keyInYN('Would you like to push the changes to the remote repository?')) {
    await runGitCommand('push --follow-tags origin main develop');
  } else {
    console.log('Changes not pushed to remote.');
    console.log('Please run the following commands to push changes:');
    console.log('git push --follow-tags origin main develop');
  }
}

function promptUser(options, message = 'Select an option:') {
  console.log(message);
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });

  const userInput = readlineSync.question('Enter the number corresponding to your choice: ');

  const selectedIndex = parseInt(userInput, 10) - 1;

  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
    console.error(
      `Error: Invalid option selected. Please enter a number between 1 and ${options.length}, or press Ctrl+C to exit.`,
    );
    return promptUser(options, message);
  }

  return options[selectedIndex];
}

function gitBranchName() {
  return runCommand('git rev-parse --abbrev-ref HEAD');
}

async function runGitFlowCommand(command) {
  await runCommand(`git flow ${command}`);
}

async function runNpmVersionCommand(args) {
  await runCommand(`npm version ${args}`);
}

async function runNpxChangelogCommand(args) {
  await runCommand(`npx changelog ${args}`);
}

async function runGitCommand(args) {
  await runCommand(`git ${args}`);
}

class WriteStream extends Writable {
  constructor(path, options) {
    super(options);
    this.path = path ?? './CHANGELOG.md';
  }

  _readChangelog() {
    try {
      return parser(readFileSync(this.path, 'utf-8'));
    } catch (e) {
      return new Changelog('Changelog');
    }
  }

  _getUnreleased(changelog) {
    return changelog.findRelease() ?? changelog.addRelease(new Release()).findRelease();
  }

  _write(chunk, encoding, callback) {
    const changelog = this._readChangelog();
    const unreleased = this._getUnreleased(changelog);
    changelog.format = 'markdownlint';

    const data = chunk
      .toString()
      .trim()
      .split('\n')
      .slice(2)
      .map((line) => line.trim().slice(2));

    const commitType = (commit) => {
      switch (true) {
        case commit.startsWith('feat'):
          return 'added';
        case commit.startsWith('fix'):
          return 'fixed';
        default:
          return 'changed';
      }
    };

    data.forEach((commit) => {
      unreleased.addChange(commitType(commit), commit);
    });

    writeFileSync(this.path, changelog.toString());
    callback();
  }

  _final(callback) {
    callback();
  }
}

main();
