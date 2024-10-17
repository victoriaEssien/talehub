import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase_setup/firebase';  // Import Firestore and Auth
import { collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyStories() {
  const [stories, setStories] = useState([]); // Stores combined stories
  const [myStories, setMyStories] = useState([]); // Stores "My Stories"
  const [clonedStories, setClonedStories] = useState([]); // Stores "Cloned Stories"
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // Dropdown filter state
  const [user] = useAuthState(auth);  // Get current authenticated user

  // Fetch stories from Firestore
  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      try {
        // Fetch 'myStories'
        const myStoriesSnapshot = await getDocs(collection(db, 'users', user.uid, 'myStories'));
        const myStoriesList = myStoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch 'myClonedStories'
        const clonedStoriesSnapshot = await getDocs(collection(db, 'users', user.uid, 'myClonedStories'));
        const clonedStoriesList = clonedStoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMyStories(myStoriesList);
        setClonedStories(clonedStoriesList);
        setStories([...myStoriesList, ...clonedStoriesList]); // Default to show "All"
      } catch (error) {
        console.error("Error fetching stories: ", error);
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [user]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;
    setFilter(selectedFilter);

    if (selectedFilter === 'My stories') {
      setStories(myStories);
    } else if (selectedFilter === 'Clones') {
      setStories(clonedStories);
    } else {
      setStories([...myStories, ...clonedStories]); // "All" includes both sets of stories
    }
  };

  return (
    <div className="my-stories">
      <h1>My Stories</h1>

      {/* Filter Dropdown */}
      <select value={filter} onChange={handleFilterChange}>
        <option value="All">All</option>
        <option value="My stories">My stories</option>
        <option value="Clones">Clones</option>
      </select>

      {loading ? (
        <p>Loading stories...</p>
      ) : stories.length === 0 ? (
        <p>No stories available.</p>
      ) : (
        <div>
          <h2>{filter} ({stories.length})</h2>
          <ul>
            {stories.map((story) => (
              <li key={story.id}>
                <Link to={`/my-stories/${story.id}`}>
                  <img src={story.image} alt={story.title} width={100} />
                  <h3>{story.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MyStories;
