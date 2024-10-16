import React, { useState, useEffect } from 'react';
import { db } from '../firebase_setup/firebase';  // Import Firestore
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase_setup/firebase';  // Import Auth

function StoryDetails() {
  const { id } = useParams();  // Get the story ID from the URL
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);  // Get current authenticated user
  const navigate = useNavigate();  // Use useNavigate hook for navigation

  // Fetch the details of the story when the component mounts
  useEffect(() => {
    const fetchStory = async () => {
      if (!user) {
        console.log("User not authenticated.");
        return;
      }

      try {
        // Dynamically fetch the user's story by using user.uid and the id from the URL
        const storyRef = doc(db, 'users', user.uid, 'myStories', id); 
        const docSnap = await getDoc(storyRef);
        if (docSnap.exists()) {
          setStory(docSnap.data());
        } else {
          console.error("Story not found");
        }
      } catch (error) {
        console.error("Error fetching story details: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, user]); // Depend on both 'id' and 'user'

  return (
    <div className="story-details">
      {loading ? (
        <p>Loading story details...</p>
      ) : story ? (
        <div>
          <h1>{story.title}</h1>
          <img src={story.image} alt={story.title} width={300} />
          <p>{story.plot}</p>

          {/* Button to continue writing */}
          {/* Use the 'id' directly from the URL to pass to the write page */}
          <button onClick={() => navigate(`/write-story/${id}`)}>Continue Writing</button>
        </div>
      ) : (
        <p>Story not found.</p>
      )}
    </div>
  );
}

export default StoryDetails;
