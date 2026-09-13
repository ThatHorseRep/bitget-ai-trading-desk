// src/setupSeekAi.ts
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const envFile = path.resolve(process.cwd(), '.env.local');

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('--- SeekAI credentials setup ---');
  const endpoint = await prompt('Enter SeekAI endpoint (e.g., https://seekai.cc/v1/chat/completions): ');
  const apiKey = await prompt('Enter your SeekAI API key (sk-...): ');
  const model = await prompt('Optional model name (press Enter to use default "deepseek-v4-flash"): ');

  const lines = [];
  if (endpoint) lines.push(`SEEKAI_ENDPOINT=${endpoint}`);
  if (apiKey) lines.push(`SEEKAI_API_KEY=${apiKey}`);
  if (model) lines.push(`SEEKAI_MODEL=${model}`);

  const content = lines.join('\n') + '\n';
  fs.writeFileSync(envFile, content, { encoding: 'utf8' });
  console.log(`Credentials written to ${envFile}`);
}

main().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});


