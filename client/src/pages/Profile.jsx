import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { users, listings as listingsAPI } from "../api";
import ListingCard from "../components/ListingCard";
import styles from "./Profile.module.css";

function Profile() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user details
        const userRes = await users.getMe();
        setUserDetails(userRes.data.data);

        // Get current user's listings using dedicated endpoint
        const listingsRes = await listingsAPI.getMyListings();
        setMyListings(listingsRes.data.data);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load profile";
        setError(errorMsg);
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUserData();
  }, [user]);

  if (loading)
    return (
      <div className={styles.container}>
        <p>Loading profile...</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  if (!userDetails)
    return (
      <div className={styles.container}>
        <p>Profile not found</p>
      </div>
    );

  return (
    <div className={styles.container}>
      {/* User Info Section */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {userDetails.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <h1>{userDetails.name}</h1>
            <p className={styles.email}>{userDetails.email}</p>
            {userDetails.phone && (
              <p className={styles.phone}>📱 {userDetails.phone}</p>
            )}
            {userDetails.location && (
              <p className={styles.location}>📍 {userDetails.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* My Listings Section */}
      <div className={styles.section}>
        <h2>My Listings ({myListings.length})</h2>
        {myListings.length === 0 ? (
          <p className={styles.empty}>You haven't posted any listings yet</p>
        ) : (
          <div className={styles.gridListings}>
            {myListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
