import { createServer } from 'node:http';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);

const { app, io } = createApp();
const httpServer = createServer(app);
io.attach(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Mighty Poker server listening on http://localhost:${PORT}`);
});
