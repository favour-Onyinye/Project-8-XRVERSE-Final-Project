import SupabaseCheck from "../components/SupabaseCheck";
import Hero from "../components/Hero";
import PostCard from "../components/PostCard";

const samplePosts = [
  {
    id: 1,
    title: "My First Immersive VR Art Gallery",
    created_at: "2026-11-01T10:00:00",
    upvotes: 42
  },
  {
    id: 2,
    title: "Exploring Procedural 3D Sculptures",
    created_at: "2026-11-02T11:00:00",
    upvotes: 28
  },
  {
    id: 3,
    title: "Animating Abstract Shapes in Blender",
    created_at: "2026-11-03T12:00:00",
    upvotes: 65
  }
];

function Home() {
  return (
    <>
      <Hero />
      <SupabaseCheck />

      <main className="community-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COMMUNITY</span>
            <h2>Explore Creative Discussions</h2>
            <p>Discover ideas from the XRVERSE community.</p>
          </div>
        </div>

        <div className="post-grid">
          {samplePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </>
  );
}

export default Home;
