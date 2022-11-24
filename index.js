const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');


app.use(cors());
app.use(express.json());


app.get('/', async(req, res) => {
res.send('Server is running in full swing')
})


app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})