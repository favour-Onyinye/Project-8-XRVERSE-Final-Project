import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Hero3D from "./Hero3D";

function Hero() {
  return (
    <section className="hero">
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-label">
          <Sparkles size={16} />
          A Universe for Digital Creators
        </div>

        <h1>
          Create Beyond
          <span> Reality.</span>
        </h1>

        <p>
          Explore the intersection of art, technology,
          and imagination. Share 3D designs, discover
          immersive VR/AR experiences, and connect
          with creators shaping the future.
        </p>

        <div className="hero-actions">
          <Link to="/create" className="primary-button">
            Share Your Creation
            <ArrowRight size={18} />
          </Link>

          <Link to="/explore" className="secondary-button">
            Explore XR Art
          </Link>
        </div>
      </motion.div>

      <motion.div
        className="hero-3d-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
       <div style={{ padding: "60px", color: "cyan" }}>
          <h2>XRVERSE 3D Sculpture</h2>
          <p>Testing the homepage before loading 3D.</p>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
