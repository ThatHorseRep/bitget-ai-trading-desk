// src/setupLlm.ts
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
  console.log('--- OpenAI-compatible LLM credentials setup ---');
  const endpoint = await prompt('Enter LLM endpoint (e.g., https://api.openai.com/v1/chat/completions): ');
  const apiKey = await prompt('Enter your LLM API key: ');
  const model = await prompt('Optional model name: ');

  const lines = [];
  if (endpoint) lines.push(`LLM_API_BASE_URL=${endpoint}`);
  if (apiKey) lines.push(`LLM_API_KEY=${apiKey}`);
  if (model) lines.push(`LLM_MODEL=${model}`);

  const content = lines.join('\n') + '\n';
  fs.writeFileSync(envFile, content, { encoding: 'utf8' });
  console.log(`Credentials written to ${envFile}`);
}

main().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
