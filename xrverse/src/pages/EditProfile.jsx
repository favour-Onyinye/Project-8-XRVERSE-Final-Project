
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Save,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

const specialties = [
  "3D Art",
  "Digital Art",
  "Digital Sculpture",
  "Virtual Reality",
  "Augmented Reality",
  "VR/AR Development",
  "Game Design",
  "Animation",
  "Product Design",
  "Creative Technology",
  "Other",
];

function EditProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================
  // 1. LOAD REGISTERED CREATOR
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (
          authError ||
          !currentUser ||
          currentUser.is_anonymous === true
        ) {
          navigate("/login", { replace: true });
          return;
        }

        const metadata =
          currentUser.user_metadata || {};

        setUser(currentUser);
        setDisplayName(metadata.display_name || "");
        setBio(metadata.bio || "");
        setSpecialty(metadata.specialty || "");
      } catch (err) {
        console.error("Profile loading error:", err);

        if (active) {
          setError(
            err.message || "Unable to load profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  // =====================================
  // 2. SAVE PROFILE CHANGES
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || !user) return;

    setError("");
    setSuccess("");

    const cleanName = displayName.trim();
    const cleanBio = bio.trim();

    if (cleanName.length < 2) {
      setError(
        "Display name must contain at least 2 characters."
      );
      return;
    }

    if (cleanName.length > 60) {
      setError(
        "Display name cannot exceed 60 characters."
      );
      return;
    }

    if (cleanBio.length > 500) {
      setError(
        "Biography cannot exceed 500 characters."
      );
      return;
    }

    if (specialty && !specialties.includes(specialty)) {
      setError("Please select a valid specialty.");
      return;
    }

    setSaving(true);

    try {
      // Recheck account ownership.
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !currentUser ||
        currentUser.is_anonymous === true ||
        currentUser.id !== user.id
      ) {
        navigate("/login", { replace: true });
        return;
      }

      // Update only editable profile metadata.
      const {
        data,
        error: updateError,
      } = await supabase.auth.updateUser({
        data: {
          display_name: cleanName,
          bio: cleanBio,
          specialty,
        },
      });

      if (updateError) throw updateError;

      setUser(data.user || currentUser);
      setSuccess("Your creator profile was updated!");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err.message || "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // 3. LOADING
  // =====================================

  if (loading) {
    return (
      <main className="edit-profile-page">
        <p role="status">
          Loading your creator profile...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="edit-profile-page">
        <p role="alert">
          {error || "Please log in to edit your profile."}
        </p>
        <Link to="/login">Log In</Link>
      </main>
    );
  }

  // =====================================
  // 4. EDIT PROFILE FORM
  // =====================================

  return (
    <main className="edit-profile-page">
      <Link
        to="/profile"
        className="details-back-link"
      >
        <ArrowLeft size={18} />
        Back to My Profile
      </Link>

      <div className="edit-profile-container">
        <div className="edit-profile-heading">
          <UserRound size={32} />

          <div>
            <h1>Edit Creator Profile</h1>
            <p>
              Personalize your identity in XRVERSE.
            </p>
          </div>
        </div>

        <p className="media-description">
          <ShieldCheck size={17} />
          Only your registered account can edit
          this information.
        </p>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <p className="profile-success" role="status">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* DISPLAY NAME */}

          <div className="form-group">
            <label htmlFor="profile-name">
              Display Name *
            </label>

            <input
              id="profile-name"
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              placeholder="Your creator name"
              minLength={2}
              maxLength={60}
              required
            />
          </div>

          {/* CREATIVE SPECIALTY */}

          <div className="form-group">
            <label htmlFor="profile-specialty">
              Creative Specialty
            </label>

            <select
              id="profile-specialty"
              value={specialty}
              onChange={(event) =>
                setSpecialty(event.target.value)
              }
            >
              <option value="">
                Select your specialty
              </option>

              {specialties.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* BIOGRAPHY */}

          <div className="form-group">
            <label htmlFor="profile-bio">
              Creator Biography
            </label>

            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              placeholder="Tell people about your creative background, projects, and interests..."
              rows={6}
              maxLength={500}
            />

            <p className="media-description">
              {bio.length}/500 characters
            </p>
          </div>

          {/* ACCOUNT EMAIL */}

          <div className="form-group">
            <label htmlFor="profile-email">
              Account Email
            </label>

            <input
              id="profile-email"
              type="email"
              value={user.email || ""}
              disabled
              readOnly
            />

            <p className="media-description">
              Account email changes are handled
              separately from profile editing.
            </p>
          </div>

          {/* SAVE */}

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoaderCircle size={18} />
                Saving Profile...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Profile Changes
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default EditProfile;
