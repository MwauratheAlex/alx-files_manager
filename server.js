import router from './routes';

const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json({ limit: '50mb' }));
app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
