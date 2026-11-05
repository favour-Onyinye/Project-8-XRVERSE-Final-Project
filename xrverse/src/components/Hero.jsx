
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
        className="hero-orb"
        animate={{
          y: [0, -25, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="orb-inner" />
      </motion.div>
    </section>
  );
}

export default Hero;
