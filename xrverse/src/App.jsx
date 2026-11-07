import EditPost from "./pages/EditPost";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import PostDetails from "./pages/PostDetails";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import Explore from "./pages/Explore";

import "./App.css";


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
            path="/post/:id"
            element={<PostDetails />}
          />

          <Route
            path="/edit/:id"
            element={<EditPost />}
          />

          <Route
            path="/explore"
            element={<Explore />}
          />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;
