const dotenv = require("dotenv");
dotenv.config({ path: "./backend/.env" });
const http = require("http");
const { Server } = require("socket.io");
const app = require("./backend/src/app");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Sustainable cities backend running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
});
