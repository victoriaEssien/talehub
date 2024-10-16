import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase_setup/firebase';  // Import Firestore and Auth
import { collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);  // Get current authenticated user

  // Fetch stories from user's 'myStories' collection
  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      try {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'myStories'));
        const storiesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStories(storiesList);
      } catch (error) {
        console.error("Error fetching stories: ", error);
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [user]);

  return (
    <div className="my-stories">
      <h1>My Stories</h1>

      {loading ? (
        <p>Loading stories...</p>
      ) : stories.length === 0 ? (
        <p>No stories available.</p>
      ) : (
        <div>
          <h2>Your Stories</h2>
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
