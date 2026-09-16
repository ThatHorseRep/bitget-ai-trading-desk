const fs = require('fs');
const html = fs.readFileSync('C:/Users/HP/.gemini/antigravity/brain/2e21f524-a7c0-4c5c-ad16-738250034968/.system_generated/steps/157/content.md', 'utf8');
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
console.log(text.substring(text.indexOf('Base Camp Hackathon S2 EN'), text.indexOf('Base Camp Hackathon S2 EN') + 4000));
