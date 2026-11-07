
import { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

function GLBModel({ url }) {
  const { scene } = useGLTF(url);

  return <primitive object={scene} />;
}

// Catch errors when models cannot load.
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("XRVERSE 3D model error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="model-error">
          Unable to load this 3D model.
          Check the model URL and file format.
        </div>
      );
    }

    return this.props.children;
  }
}

function ModelViewer({ url }) {
  let modelUrl;

  try {
    const parsed = new URL(url, window.location.origin);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported URL");
    }

    if (!/\.gltf?b?(?:$)/i.test(parsed.pathname)) {
      // Accept only paths ending in .glb or .gltf.
      if (!/\.(glb|gltf)$/i.test(parsed.pathname)) {
        throw new Error("Unsupported file format");
      }
    }

    modelUrl = parsed.href;
  } catch {
    return (
      <div className="model-error">
        Please provide a direct .glb or .gltf model URL.
      </div>
    );
  }

  return (
    <div className="model-viewer">
      <ModelErrorBoundary key={modelUrl}>
        <Canvas
          camera={{
            position: [3, 2, 5],
            fov: 45,
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
          }}
          fallback={
            <p>3D rendering is unavailable on this device.</p>
          }
        >
          <ambientLight intensity={1.4} />

          <directionalLight
            position={[5, 8, 5]}
            intensity={3}
          />

          <directionalLight
            position={[-4, 2, -4]}
            color="#a78bfa"
            intensity={1.5}
          />

          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.3}>
              <GLBModel url={modelUrl} />
            </Bounds>
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={0.1}
            maxDistance={100}
          />
        </Canvas>
      </ModelErrorBoundary>

      <div className="model-viewer-label">
        Interactive 3D Artwork
      </div>

      <div className="model-viewer-hint">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

export default ModelViewer;
