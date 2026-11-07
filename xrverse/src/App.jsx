
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import PostDetails from "./pages/PostDetails";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";

import "./App.css";

function Placeholder({ title }) {
  return (
    <main className="placeholder-page">
      <h1>{title}</h1>
      <p>This feature is coming soon to XRVERSE.</p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/create"
            element={<CreatePost />}
          />

          <Route
            path="/explore"
            element={
              <Placeholder title="Explore XR Art" />
            }
          />

          <Route
            path="/post/:id"
            element={<PostDetails />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
