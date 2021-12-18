const { Server } = require("socket.io");
const { throttle } = require("throttle-debounce");

const express = require("express");

const http = require("http");
const app = express();

app.use(express.static("build"));
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

const state = {
  center: [300, 300],
  scale: 1,
  strokes: [],
  lines: [],
  folks: {},
};

io.on("connection", (socket) => {
  const updateOthers = throttle(120, false, (movement) => {
    // sending to all clients except sender
    socket.broadcast.emit("state", state);
  });

  socket.emit("state", state);

  socket.on("move", (movement) => {
    const [mx, my] = movement;
    state.center[0] -= mx;
    state.center[1] -= my;

    updateOthers();
  });
  socket.on("scale", (newScale) => {
    state.scale = newScale;

    updateOthers();
  });
  socket.on("self", (self) => {
    state.folks[socket.id] = self;
    updateOthers();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});
