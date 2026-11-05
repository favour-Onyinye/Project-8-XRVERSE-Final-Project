
import { Link, NavLink } from "react-router-dom";
import { Orbit, PlusCircle, Compass } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <Orbit size={28} />
        <span>XRVERSE</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Community</NavLink>
        <NavLink to="/explore">
          <Compass size={17} /> Explore
        </NavLink>
      </nav>

      <Link to="/create" className="create-button">
        <PlusCircle size={18} />
        Create Post
      </Link>
    </header>
  );
}

export default Navbar;
