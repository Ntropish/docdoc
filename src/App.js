import { useEffect, useState, useMemo, useRef } from "react";

import "./App.css";
import { io } from "socket.io-client";
import Menu from "./Menu";
import { useDrag } from "@use-gesture/react";
import MenuIcon from "@mui/icons-material/Menu";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMeasure from "react-use-measure";

import { useGesture } from "@use-gesture/react";

import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

import { Slider } from "@mui/material";
import { Box } from "@mui/system";
import { Canvas, useFrame } from "@react-three/fiber";
import Draggable from "react-draggable";
export const themeOptions = {
  palette: {
    type: "dark",
    primary: {
      main: "#c8c8c8",
    },
    background: {
      default: "#111",
      paper: "#424242",
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
  let [dragStart, setDragStart] = useState();
  let [ref, bounds] = useMeasure();

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    // client-side
    socket.on("state", (newState) => {
      setState(newState);
      console.log(newState);
    });
  }, []);

  const imgStyle = useMemo(() => {
    if (!state) return {};

    const top = state.center[1] * state.scale;
    const left = state.center[0] * state.scale;
    const width = 1000 * state.scale;
    const style = {
      touchAction: "none",
      maxWidth: "none",
      position: "absolute",
      top: `calc(50% - ${top}px)`,
      left: `calc(50% - ${left}px)`,
      width: width + "px",
    };
    // if (!dragging) style.transition = "top 200ms ease 100ms";
    return style;
  }, [state]);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMenuClose = () => setMenuOpen(false);

  const [user, setUser] = useState({
    hue: 0,
    saturation: 70,
    softness: 50,
    occupation: "mover",
  });
  const { hue, saturation, softness, occupation } = user;

  useEffect(() => {
    if (!socket) return;
    socket.emit("self", user);
  }, [user, socket]);

  const handleChangeHue = (event, hue) => {
    setUser((old) => ({
      ...old,
      hue,
    }));
  };
  const handleChangeSaturation = (event, saturation) => {
    setUser((old) => ({
      ...old,
      saturation,
    }));
  };
  const handleChangeSoftness = (event, softness) => {
    setUser((old) => ({
      ...old,
      softness,
    }));
  };
  const handleChangeOccupation = (event, occupation) => {
    setUser((old) => ({
      ...old,
      occupation,
    }));
  };

  const theme = useMemo(() => {
    return createTheme(themeOptions);
  }, []);

  const bind = useGesture({
    onDrag: (dragState) => {
      const { dragging, delta } = dragState;

      if (user.occupation === "mover") {
        setDragging(dragging);

        const dx = delta[0] / state.scale;
        const dy = delta[1] / state.scale;
        socket.emit("move", [dx, dy]);

        setState((oldState) => ({
          ...oldState,
          center: [oldState.center[0] - dx, oldState.center[1] - dy],
        }));
      }
    },
    onDragStart: (dragStartState) => {
      if (user.occupation === "liner") {
        // Stored in screen space, but will be converted to "center" space before sending
        setDragStart(dragStartState.xy);
        setDragging(true);
      }
    },
    onDragEnd: (dragStopState) => {
      if (user.occupation === "liner") {
        setDragging(false);

        const [dsx, dsy] = dragStart;
        const [dex, dey] = dragStopState.xy;
        const [cx, cy] = state.center;
        const halfWidth = window.innerWidth / 2;
        const halfHeight = window.innerHeight / 2;

        const line = [
          [
            (cx + dsx - halfWidth) * state.scale,
            (cy - halfHeight + dsy) * state.scale,
          ],
          [
            (cx + dex - halfWidth) * state.scale,
            (cy - halfHeight + dey) * state.scale,
          ],
        ];

        socket.emit("line", line);

        setState((oldState) => {
          const lines = [...oldState.lines, line];
          return {
            ...oldState,
            lines,
          };
        });
      }
    },
    // onPinch: (state) => doSomethingWith(state),
    // onScroll: (state) => doSomethingWith(state),
    // onMove: (state) => doSomethingWith(state),
    onWheel: (wheelState) => {
      const sign = -1 * wheelState.direction[1];

      const newScale = state.scale * (1 + sign * 0.03);
      setState((oldState) => ({
        ...oldState,
        scale: newScale,
      }));

      socket.emit("scale", newScale);
    },
    onMove: (hoverState) => {
      // console.log(hoverState);
    },
  });

  let cursorClass;

  if (user.occupation === "mover") {
    if (dragging) {
      cursorClass = "cursor-grabbing";
    } else {
      cursorClass = "cursor-grab";
    }
  } else {
    if (dragging) {
      cursorClass = "cursor-crosshair";
    } else {
      cursorClass = "cursor-crosshair";
    }
  }

  // const lines = state.lines.map((line) => {
  //   return <line></line>;
  // });

  return (
    <ThemeProvider theme={theme}>
      <div className={`App overflow-hidden ${cursorClass}`}>
        <div {...bind()} className="absolute inset-0 touch-none">
          <img
            ref={ref}
            src="/pieza.png"
            alt="pieza"
            style={imgStyle}
            onDragStart={preventDragHandler}
          />
          {/* <svg>{lines}</svg> */}
        </div>
        {/* <div className="absolute top-0 right-0">
          {JSON.stringify(state, null, 2)}
        </div> */}
        {/* <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          className="absolute top-4 left-4"
          onClick={toggleMenu}
        >
          <MenuIcon />
        </IconButton> */}
        {/* {menuOpen ? (
          <DraggablePaper title="How Would You Describe Yourself?">
            <Stack direction="row" spacing={3} justifyContent="center">
              <Box sx={{ width: "120px" }}>
                <Typography id="hue-slider">Hue</Typography>
                <Slider
                  min={0}
                  max={360}
                  valueLabelDisplay="auto"
                  value={hue}
                  onChange={handleChangeHue}
                />
              </Box>
              <Box sx={{ width: "120px" }}>
                <Typography id="color-slider">Colorful</Typography>
                <Slider
                  valueLabelDisplay="auto"
                  value={saturation}
                  onChange={handleChangeSaturation}
                />
              </Box>
              <Box sx={{ width: "120px" }}>
                <Typography id="hue-slider">Soft</Typography>
                <Slider
                  defaultValue={70}
                  valueLabelDisplay="auto"
                  value={softness}
                  onChange={handleChangeSoftness}
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={3}>
              <Box sx={{ width: "300px" }}>
                <Canvas>
                  {/* <FlyControls
          autoForward={false}
          dragToLook={true}
          movementSpeed={3.0}
          rollSpeed={0.5}
        /> 
                  <ambientLight intensity={0.7} />
                  <pointLight position={[-200, 200, 100]} />
                  <Ball hue={hue} saturation={saturation} softness={softness} />
                  <EffectComposer>
                    <Noise opacity={0.02} />
                    <Bloom
                      luminanceThreshold={1 - softness / 100}
                      luminanceSmoothing={0.9}
                      height={70}
                    />
                    {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> 
                  </EffectComposer>
                </Canvas>
              </Box>

              <ToggleButtonGroup
                color="primary"
                orientation="vertical"
                value={occupation}
                exclusive
                onChange={handleChangeOccupation}
              >
                <ToggleButton value="artist" aria-label="artist">
                  Artist
                </ToggleButton>
                <ToggleButton value="mover" aria-label="mover">
                  Movement Expert
                </ToggleButton>
                <ToggleButton value="liner" aria-label="liner">
                  Line Drawer
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </DraggablePaper>
        ) : null} */}
      </div>
    </ThemeProvider>
  );
}

function Ball(props) {
  const { hue, saturation, softness } = props;
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    if (ref.current && ref.current.rotation) {
      ref.current.rotation.x += 0.01;
    }
  });

  const scale = 0.8 + softness / 100 / 8;
  // const transmission = softness / 100 / 2;
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={scale}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
    >
      <icosahedronGeometry args={[2, 5]} />
      <meshPhysicalMaterial
        color={`hsl(${hue}, ${saturation}%, 70%)`}
        roughness={0.8}
      />
    </mesh>
  );
}

function DraggablePaper(props) {
  const { title, children, ...notChildren } = props;
  return (
    <Draggable handle=".handle" defaultPosition={{ x: 0, y: 0 }}>
      <Paper
        elevation={4}
        {...notChildren}
        className="p-2"
        sx={{ width: "30rem" }}
      >
        <Stack
          direction="row"
          className="drag-me m-2 handle"
          spacing={2}
          sx={{ cursor: "grab" }}
        >
          <DragHandleIcon />
          <Typography variant="h6">{title}</Typography>
        </Stack>
        <div className="draggable-paper-content">{children}</div>
      </Paper>
    </Draggable>
  );
}

function preventDragHandler(e) {
  e.preventDefault();
}

export default App;
