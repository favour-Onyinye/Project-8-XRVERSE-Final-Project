
import { useEffect, useState } from "react";
import { Box, Image, Lock } from "lucide-react";

import ModelViewer from "./ModelViewer";
import { getPrivateMediaUrl } from "../lib/getPrivateMediaUrl";

function PrivatePostMedia({
  imagePath,
  modelPath,
  title = "Private artwork",
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPrivateMedia() {
      try {
        const [imageResult, modelResult] =
          await Promise.all([
            imagePath
              ? getPrivateMediaUrl(imagePath)
              : Promise.resolve(null),

            modelPath
              ? getPrivateMediaUrl(modelPath)
              : Promise.resolve(null),
          ]);

        if (!active) return;

        setImageUrl(imageResult);
        setModelUrl(modelResult);
        setError("");
      } catch (err) {
        console.error(
          "Private media loading error:",
          err
        );

        if (active) {
          setError(
            "Unable to display private media. " +
            "Please verify that you are signed in " +
            "with the account that owns these files."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrivateMedia();

    return () => {
      active = false;
    };
  }, [imagePath, modelPath]);

  if (!imagePath && !modelPath) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="upload-progress"
        role="status"
      >
        <div className="xr-loader" />
        <span>Loading private artwork...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-error" role="alert">
        {error}
      </div>
    );
  }

  return (
    <section className="private-post-media">
      <div className="post-3d-heading">
        <Lock size={20} />
        <h2>Your Private Artwork</h2>
      </div>

      {imageUrl && (
        <div className="post-artwork">
          <div className="post-3d-heading">
            <Image size={18} />
            <h3>Private Image</h3>
          </div>

          <img
            src={imageUrl}
            alt={`Private artwork for ${title}`}
            loading="lazy"
          />
        </div>
      )}

      {modelUrl && (
        <section className="post-3d-section">
          <div className="post-3d-heading">
            <Box size={22} />
            <h3>Private 3D Model</h3>
          </div>

          <p>
            Rotate and explore your private
            3D creation.
          </p>

          <ModelViewer url={modelUrl} />
        </section>
      )}
    </section>
  );
}

export default PrivatePostMedia;
