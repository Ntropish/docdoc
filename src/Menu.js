import { useRef, useState } from "react";

// import { FlyControls } from "@react-three/drei";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

import { Slider, Stack, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { Canvas, useFrame } from "@react-three/fiber";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper elevation={2} {...props} />
    </Draggable>
  );
}

export default function Menu(props) {
  const { hue, saturation, softness } = props.color;

  const handleChangeHue = (event, hue) => {
    if (Array.isArray(hue)) return;
    props.setColor((old) => {
      return {
        ...old,
        hue,
      };
    });
  };
  const handleChangeSaturation = (event, saturation) => {
    if (Array.isArray(saturation)) return;
    props.setColor((old) => {
      return {
        ...old,
        saturation,
      };
    });
  };
  const handleChangeSoftness = (event, softness) => {
    if (Array.isArray(softness)) return;
    props.setColor((old) => {
      return {
        ...old,
        softness,
      };
    });
  };
  return (
    <Dialog
      hideBackdrop={true}
      open={props.open}
      disableEnforceFocus={true}
      onClose={props.handleClose}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
        How would you describe yourself?
      </DialogTitle>
      <DialogContent className="p-8">
        <Canvas>
          {/* <FlyControls
          autoForward={false}
          dragToLook={true}
          movementSpeed={3.0}
          rollSpeed={0.5}
        /> */}
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
            {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
          </EffectComposer>
        </Canvas>
        <Box>
          <Typography id="hue-slider">Hue</Typography>
          <Slider
            min={0}
            max={360}
            valueLabelDisplay="auto"
            value={hue}
            onChange={handleChangeHue}
          />
        </Box>
        <Box>
          <Typography id="color-slider">Colorful</Typography>
          <Slider
            valueLabelDisplay="auto"
            value={saturation}
            onChange={handleChangeSaturation}
          />
        </Box>
        {/* <Box>
        <Typography id="hue-slider">Light</Typography>
        <Slider
          defaultValue={70}
          aria-label="hiue-slider"
          aria-labeldby="hue-slider"
          valueLabelDisplay="auto"
        />
      </Box> */}
        <Box>
          <Typography id="hue-slider">Soft</Typography>
          <Slider
            defaultValue={70}
            valueLabelDisplay="auto"
            value={softness}
            onChange={handleChangeSoftness}
          />
        </Box>
      </DialogContent>
    </Dialog>
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
