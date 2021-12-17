const { Server } = require("socket.io");
const { throttle } = require("throttle-debounce");

const io = new Server({
  /* options */
});

const state = {
  center: [0, 0],
  radius: 400,
  strokes: [],
};

io.on("connection", (socket) => {
  const updateOthers = throttle(500, false, (movement) => {
    // sending to all clients except sender
    socket.broadcast.emit("state", state);
  });

  socket.emit("state", state);

  socket.on("move", (movement) => {
    const [mx, my] = movement;
    state.center[0] -= mx;
    state.center[1] -= my;

    console.log(state, movement);

    // sending to all clients except sender
    updateOthers();
  });
});

io.listen(3050);
