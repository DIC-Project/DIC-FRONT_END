const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('./'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Web is listening on port ${port}`);
});

module.exports = app;
