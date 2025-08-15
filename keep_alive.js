const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Ich bin online!');
});

const port = process.env.PORT || 3000;  // Render nutzt process.env.PORT
app.listen(port, () => {
  console.log(`Keep-alive Webserver läuft auf Port ${port}`);
});