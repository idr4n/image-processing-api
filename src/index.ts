import express from 'express';
import routes from './routes';

const app = express();
const port = 3000;

// routes middleware
app.use('/', routes);

app.listen(port, (): void => {
  console.log(`Server started at http://localhost:${port}`);
});

export default app;
