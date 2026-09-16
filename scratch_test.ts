import { parseNaturalLanguageTrade } from './src/core/trade/parser.js';
console.log(JSON.stringify(parseNaturalLanguageTrade('I want to sell two grand of rAAPL on Friday. I already have $10000 SOL. Stress test this trade.'), null, 2));
