import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { db } from '../firebase_setup/firebase';
import { doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase_setup/firebase';
import 'react-quill/dist/quill.snow.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';  // Add Modal library

function WriteStory() {
  const { id } = useParams(); // Get the story ID from the URL
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState(''); // The content of the chapter being edited
  const [selectedChapter, setSelectedChapter] = useState(null); // Track the selected chapter key
  const [user] = useAuthState(auth); // Get current authenticated user
  const quillRef = useRef(null); // create a ref
  const [isPRModalOpen, setPRModalOpen] = useState(false); // PR modal state
  const [prTitle, setPRTitle] = useState(''); // PR form title
  const [prComment, setPRComment] = useState(''); // PR form comment

  // Fetch the story details from Firestore on component mount
  useEffect(() => {
    const fetchStory = async () => {
      if (!user) {
        console.log("User not authenticated.");
        return;
      }

      try {
        // Try fetching from myClonedStories first
        let storyRef = doc(db, 'users', user.uid, 'myClonedStories', id);
        let docSnap = await getDoc(storyRef);

        if (!docSnap.exists()) {
          // If not found in myClonedStories, fetch from myStories (the ones created by the user)
          storyRef = doc(db, 'users', user.uid, 'myStories', id);
          docSnap = await getDoc(storyRef);
        }

        if (docSnap.exists()) {
          const storyData = docSnap.data();
          const chapters = storyData.chapters || {};  // Make sure to fetch the chapters (stored as key-value pairs)
          setStory({
            ...storyData,
            chapters: chapters,
          });
          if (Object.keys(chapters).length > 0) {
            const firstChapterKey = Object.keys(chapters)[0];
            setSelectedChapter(firstChapterKey); // Set the initial chapter key
            setEditorContent(chapters[firstChapterKey]); // Set the initial chapter content
          }
        } else {
          console.error("Story not found in both collections.");
        }
      } catch (error) {
        console.error("Error fetching story details: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, user]);

  // Handle editor content change
  const handleEditorChange = (value) => {
    setEditorContent(value); // Update the editor content
  };

  // Save the chapter updates to Firestore
  const handleSave = async () => {
    if (!editorContent) {
      toast.error("Please write something before saving.");
      return;
    }

    try {
      // Check if the current user is the creator
      const isCreator = story.creatorId === user.uid;

      let storyRef;
      if (isCreator) {
        // If the user is the creator, save to myStories
        storyRef = doc(db, 'users', user.uid, 'myStories', id);
      } else {
        // If the user is not the creator, update myClonedStories
        storyRef = doc(db, 'users', user.uid, 'myClonedStories', id);
      }

      const docSnap = await getDoc(storyRef);  // Check if the story exists

      if (docSnap.exists()) {
        // If the story exists, update the selected chapter content
        const updatedChapters = {
          ...story.chapters,
          [selectedChapter]: editorContent, // Update the content for the selected chapter
        };

        await updateDoc(storyRef, {
          chapters: updatedChapters, // Save the updated chapters with the new content
          updatedAt: new Date(), // Optionally update the timestamp
        });

        toast.success("Chapter updated successfully!");
      } else {
        // If the story does not exist, create it
        const newStoryData = {
          creatorId: user.uid,
          title: story.title,  // Add other relevant story data here
          chapters: {
            [selectedChapter]: editorContent,  // Add the new chapter content
          },
          updatedAt: new Date(),
        };

        await setDoc(storyRef, newStoryData);  // Create the document if it doesn't exist
        toast.success("Story created successfully!");
      }

      // Update local state to reflect the changes without requiring a refresh
      setStory((prevStory) => ({
        ...prevStory,
        chapters: {
          ...prevStory.chapters,
          [selectedChapter]: editorContent,
        },
      }));

    } catch (error) {
      console.error("Error saving story: ", error);
      toast.error("Failed to save the chapter.");
    }
  };

  // Select a chapter from the list
  const handleChapterSelect = (chapterKey) => {
    setSelectedChapter(chapterKey); // Set the selected chapter key
    setEditorContent(story.chapters[chapterKey]); // Load the content of the selected chapter
  };

  // Handle the creation of a new chapter
  const handleCreateNewChapter = () => {
    const newChapterKey = `chapter_${Object.keys(story.chapters).length + 1}`;
    setSelectedChapter(newChapterKey); // Set the selected chapter to the new one
    setEditorContent(''); // Clear the editor content for the new chapter
  };

  // Handle PR creation
  const handlePRSubmit = async () => {
    try {
      if (!prTitle || !prComment) {
        toast.error("Please fill in all fields before submitting the PR.");
        return;
      }

      const creatorId = story.creatorId; // The ID of the original creator
      const prData = {
        ...story,
        prTitle,
        prComment,
        submittedBy: user.uid, // The user submitting the PR
        submittedAt: new Date(),
      };

      // Add the PR to the creator's PR collection
      const prRef = doc(db, 'users', creatorId, 'pr', id); // Using the same story ID
      await setDoc(prRef, prData);

      // Delete the cloned story from myClonedStories
      const clonedStoryRef = doc(db, 'users', user.uid, 'myClonedStories', id);
      await deleteDoc(clonedStoryRef);

      toast.success("PR submitted successfully!");

      setPRModalOpen(false); // Close the modal

    } catch (error) {
      console.error("Error submitting PR: ", error);
      toast.error("Failed to submit PR.");
    }
  };

  // Handle story publishing
  const handlePublish = async () => {
    if (!story || !user) return;

    try {
      const storyRef = doc(db, 'stories', id); // Reference the story in the 'stories' collection
      const docSnap = await getDoc(storyRef);

      const storyData = {
        ...story,  // Include the full story data
        creatorId: user.uid,
        updatedAt: new Date(),  // Set the publish/update time
      };

      if (docSnap.exists()) {
        // Story already published, so update it
        await updateDoc(storyRef, storyData);
        toast.success("Story updated successfully in the 'stories' collection!");
      } else {
        // Publish as a new story
        await setDoc(storyRef, storyData);
        toast.success("Story published successfully!");
      }

    } catch (error) {
      console.error("Error publishing story: ", error);
      toast.error("Failed to publish the story.");
    }
  };

  return (
    <div className="write-story">
      {loading ? (
        <p>Loading story...</p>
      ) : story ? (
        <div>
          <h1>Edit {story.title}</h1>
          {/* Display chapter links */}
          <div>
            {Object.keys(story.chapters).map((chapterKey) => (
              <button
                key={chapterKey}
                onClick={() => handleChapterSelect(chapterKey)}
              >
                {chapterKey}
              </button>
            ))}
          </div>
          <button onClick={handleCreateNewChapter}>add new chapter</button>
          {/* Editor for writing */}
          <ReactQuill
            ref={quillRef}
            value={editorContent}
            onChange={handleEditorChange}
          />
          <div>
            {/* Conditional render for save button */}
            <button onClick={handleSave}>Save Chapter</button>

            {/* PR Modal for submitting a pull request */}
            {user.uid !== story.creatorId && (
              <>
                <button onClick={() => setPRModalOpen(true)}>Create PR</button>
                <Modal
                  isOpen={isPRModalOpen}
                  onRequestClose={() => setPRModalOpen(false)}
                >
                  <h2>Create Pull Request</h2>
                  <input
                    type="text"
                    placeholder="PR Title"
                    value={prTitle}
                    onChange={(e) => setPRTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="PR Comment"
                    value={prComment}
                    onChange={(e) => setPRComment(e.target.value)}
                  />
                  <button onClick={handlePRSubmit}>Submit PR</button>
                  <button onClick={() => setPRModalOpen(false)}>Cancel</button>
                </Modal>
              </>
            )}

            {/* Optionally show the publish button for creators */}
            {story.creatorId === user.uid && (
              <button onClick={handlePublish}>Publish Story</button>
            )}
          </div>
          <ToastContainer />
        </div>
      ) : (
        <p>No story found</p>
      )}
    </div>
  );
}

export default WriteStory;
