const { execSync } = require('child_process');
const { config } = require('dotenv');

config({ path: '.env.local' });
config({ path: '.env' });
config();

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'AI_DB_PASSWORD',
];

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key].trim().length === 0);

if (missingEnvVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingEnvVars.forEach((key) => console.error(`- ${key}`));
  console.error('\nSet these values in `.env.local` or `.env` before starting the app.\n');
  process.exit(1);
}

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'no-git-info';
  }
};

let commitJson = {
  hash: JSON.stringify(getGitHash()),
  version: JSON.stringify(process.env.npm_package_version),
};

console.log(`
★═══════════════════════════════════════★
          S M A C K . S H
        😎 Welcome  to Smack 😎
★═══════════════════════════════════════★
`);
console.log('📍 Current Version Tag:', `v${commitJson.version}`);
console.log('📍 Current Commit Version:', commitJson.hash);
console.log('  Please wait until the URL appears here');
console.log('★═══════════════════════════════════════★');
