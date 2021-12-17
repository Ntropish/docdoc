import { useEffect, useState, useMemo } from "react";

import "./App.css";
import { io } from "socket.io-client";
import Menu from "./Menu";
import { useDrag } from "@use-gesture/react";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMeasure from "react-use-measure";

import { useGesture } from "@use-gesture/react";

export const themeOptions = {
  palette: {
    type: "dark",
    primary: {
      main: "#c8c8c8",
    },
    background: {
      default: "#111",
      paper: "#222",
    },
    text: {
      primary: "rgba(255,255,255,0.8)",
    },
  },
};

function App() {
  let [socket, setSocket] = useState();
  let [state, setState] = useState();
  let [dragging, setDragging] = useState();
  let [ref, bounds] = useMeasure();

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    // client-side
    socket.on("state", (initState) => {
      setState(initState);
    });
  }, []);

  useEffect(() => {
    console.log("socket", socket);
  }, [socket]);

  const imgStyle = useMemo(() => {
    if (!state) return {};

    const top = state.center[1] * state.scale;
    const left = state.center[0] * state.scale;
    const style = {
      position: "absolute",
      top: `calc(50% - ${top}px)`,
      left: `calc(50% - ${left}px)`,
      width: "1000px",
    };
    if (!dragging) style.transition = "top 200ms ease 100ms";
    return style;
  }, [state]);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMenuClose = () => setMenuOpen(false);

  const [color, setColor] = useState({ hue: 0, saturation: 70, softness: 50 });
  const theme = useMemo(() => {
    return createTheme(themeOptions);
  }, [color]);

  const bind = useDrag();

  const bind = useGesture(
    {
      onDrag: (state) => {
        const {
          dragging,
          delta: [dx, dy],
        } = state;

        console.log(bounds);

        // const dx = (delta[0] / window.innerWidth) * 100;
        // const dy = (delta[1] / window.innerHeight) * 100;

        setDragging(dragging);

        socket.emit("move", [dx, dy]);

        setState((oldState) => ({
          ...oldState,
          center: [oldState.center[0] - dx, oldState.center[1] - dy],
        }));
      },
      onPinch: (state) => doSomethingWith(state),
      onScroll: (state) => doSomethingWith(state),
      onMove: (state) => doSomethingWith(state),
      onWheel: (state) => doSomethingWith(state),
      onWheelStart: (state) => doSomethingWith(state),
      onWheelEnd: (state) => doSomethingWith(state),
      onHover: (state) => doSomethingWith(state),
    },
    config
  );

  return (
    <div className="App overflow-hidden" {...bind()}>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="menu"
        className="absolute top-4 left-4"
        onClick={toggleMenu}
      >
        <MenuIcon />
      </IconButton>
      <div className="absolute top-4 right-4 whitespace-pre">
        {JSON.stringify(state, 0, 2)}
      </div>
      {menuOpen ? (
        <Menu
          color={color}
          setColor={setColor}
          open={menuOpen}
          handleClose={handleMenuClose}
        />
      ) : null}
      <img
        ref={ref}
        src="/smol.png"
        alt="music score to mark up"
        style={imgStyle}
        onDragStart={preventDragHandler}
      />
    </div>
  );
}

function preventDragHandler(e) {
  e.preventDefault();
}

export default App;
