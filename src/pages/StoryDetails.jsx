import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase_setup/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';  // Import setDoc to manually set the document ID
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

function StoryDetails() {
  const { id } = useParams();  // Get story ID from the URL
  const [story, setStory] = useState(null);
  const [authorName, setAuthorName] = useState('Unknown Author');  // Default to 'Unknown Author'
  const [user] = useAuthState(auth);  // Get current authenticated user
  const navigate = useNavigate();

  // Fetch story details from Firestore
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const storyRef = doc(db, 'stories', id);
        const storySnap = await getDoc(storyRef);

        if (storySnap.exists()) {
          const storyData = storySnap.data();
          setStory(storyData);

          // Fetch the author's username using the creatorId if it exists
          if (storyData.creatorId) {
            const authorRef = doc(db, 'users', storyData.creatorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              setAuthorName(authorSnap.data().username);  // Assuming 'username' field exists
            }
          }
        } else {
          toast.error("Story not found");
        }
      } catch (error) {
        console.error("Error fetching story: ", error);
        toast.error("Failed to load story");
      }
    };

    fetchStory();
  }, [id]);

  // Handle cloning of the story
  const handleClone = async () => {
    try {
      const clonedStory = {
        ...story,
        cloneCreatorId: user.uid,
        clonedAt: new Date(),  // Add a timestamp
      };

      // Set the document with the same story ID in the user's 'myClonedStories' collection
      const clonedStoryRef = doc(db, 'users', user.uid, 'myClonedStories', id);
      await setDoc(clonedStoryRef, clonedStory);

      toast.success("Story cloned successfully!");
      navigate('/my-stories');  // Redirect to 'my-stories' after cloning
    } catch (error) {
      console.error("Error cloning story: ", error);
      toast.error("Failed to clone story");
    }
  };

  // If story is still loading
  if (!story) return <p>Loading story details...</p>;

  // Check if the current user is the creator of the story
  const isOwner = user && story.creatorId && user.uid === story.creatorId;

  return (
    <div>
      <h2>{story.title}</h2>
      <img src={story.image} alt={story.title} width={200} />
      <p><strong>Plot:</strong> {story.plot}</p>
      <p><strong>Author:</strong> {authorName}</p>  {/* Display author's username */}
  
      {/* Display the number of chapters */}
      {story.chapters && typeof story.chapters === 'object' ? (
        <p><strong>Chapters:</strong> {Object.keys(story.chapters).length}</p>
      ) : (
        <p><strong>Chapters:</strong> N/A</p>
      )}
  
      {isOwner ? (
        <button onClick={() => navigate(`/write-story/${id}`)}>Edit Story</button>
      ) : (
        <button onClick={handleClone}>Clone Story</button>
      )}
      
      <button onClick={() => navigate(`/read-story/${id}`)}>Read Story</button>
    </div>
  );
}

export default StoryDetails;
