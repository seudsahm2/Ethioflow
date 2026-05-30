const https = require('https');
const fs = require('fs');

https.get('https://core.telegram.org/bots/api', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract everything from "Recent changes" down
    const recentChangesMatch = data.match(/>Recent changes<[\s\S]*?(?=<h3)/i);
    if (recentChangesMatch) {
      console.log("=== RECENT TELEGRAM API CHANGES ===");
      // Strip HTML tags roughly to make it readable in terminal
      let text = recentChangesMatch[0].replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n');
      console.log(text.substring(0, 3000)); 
    } else {
      console.log("Could not parse recent changes. Dumping full text.");
      fs.writeFileSync('telegram_api.html', data);
    }
  });
});
