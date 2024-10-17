import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase_setup/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

function MyStoryDetails() {
  const { id } = useParams();  // Get story ID from the URL
  const [story, setStory] = useState(null);
  const [authorName, setAuthorName] = useState('Unknown Author');
  const [user] = useAuthState(auth);  // Get current authenticated user
  const navigate = useNavigate();

  // Fetch story details from the 'myClonedStories' or 'myStories' collection
  useEffect(() => {
    const fetchStory = async () => {
      if (!user) return;

      try {
        // Try fetching from 'myClonedStories' collection first
        const clonedStoryRef = doc(db, 'users', user.uid, 'myClonedStories', id);
        const clonedStorySnap = await getDoc(clonedStoryRef);

        if (clonedStorySnap.exists()) {
          const storyData = clonedStorySnap.data();
          setStory(storyData);
          setAuthorName(user.displayName || 'Unknown Author');  // Set the user's name as the author
        } else {
          // If the story is not in 'myClonedStories', fetch from 'myStories'
          const myStoryRef = doc(db, 'users', user.uid, 'myStories', id);
          const myStorySnap = await getDoc(myStoryRef);

          if (myStorySnap.exists()) {
            const storyData = myStorySnap.data();
            setStory(storyData);
            setAuthorName(user.displayName || 'Unknown Author');
          } else {
            toast.error("Story not found");
          }
        }
      } catch (error) {
        console.error("Error fetching story: ", error);
        toast.error("Failed to load story");
      }
    };

    fetchStory();
  }, [id, user]);

  // If story is still loading
  if (!story) return <p>Loading story details...</p>;

  return (
    <div>
      <h2>{story.title}</h2>
      <img src={story.image} alt={story.title} width={200} />
      <p><strong>Plot:</strong> {story.plot}</p>
      <p><strong>Author:</strong> {authorName}</p>
      <p><strong>Chapters:</strong> {story.chapters ? Object.keys(story.chapters).length : 'N/A'}</p>
      
      <button onClick={() => navigate(`/write-story/${id}`)}>Edit Story</button>
      <button onClick={() => navigate(`/read-story/${id}`)}>Read Story</button>
    </div>
  );
}

export default MyStoryDetails;
