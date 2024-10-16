import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { db } from '../firebase_setup/firebase'; // Import Firestore
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase_setup/firebase'; // Import Auth
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

function WriteStory() {
  const { id } = useParams(); // Get the story ID from the URL
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState(''); // The content of the chapter being edited
  const [selectedChapter, setSelectedChapter] = useState(null); // Track the selected chapter key
  const [user] = useAuthState(auth); // Get current authenticated user
  const navigate = useNavigate(); // Use useNavigate hook for navigation
  const quillRef = useRef(null); // create a ref

  // Fetch the story details from Firestore on component mount
  useEffect(() => {
    const fetchStory = async () => {
      if (!user) {
        console.log("User not authenticated.");
        return;
      }

      try {
        const storyRef = doc(db, 'users', user.uid, 'myStories', id);
        const docSnap = await getDoc(storyRef);
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
          console.error("Story not found");
        }
      } catch (error) {
        console.error("Error fetching story details: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, user]); // Fetch when 'id' or 'user' changes

  // Handle editor content change
  const handleEditorChange = (value) => {
    setEditorContent(value); // Update the editor content
  };

  // Save the chapter updates to Firestore
// Save the chapter updates to Firestore
const handleSave = async () => {
    if (!editorContent) {
      alert("Please write something before saving.");
      return;
    }
  
    try {
      const storyRef = doc(db, 'users', user.uid, 'myStories', id);
  
      // Update the selected chapter content or add a new chapter if it doesn't exist
      const updatedChapters = {
        ...story.chapters,
        [selectedChapter]: editorContent, // Update the content for the selected chapter
      };
  
      await updateDoc(storyRef, {
        chapters: updatedChapters, // Save the updated chapters with the new content
        updatedAt: new Date(), // Optionally update the timestamp
      });
  
      alert("Chapter updated successfully!");
  
      // Update local state to reflect the changes without requiring a refresh
      setStory((prevStory) => ({
        ...prevStory,
        chapters: updatedChapters, // Update the chapters in the local state
      }));
  
      // Optionally, set the editor content to the saved chapter (if needed)
      setEditorContent(updatedChapters[selectedChapter]);
  
    } catch (error) {
      console.error("Error saving story: ", error);
      alert("Failed to save the chapter.");
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

  return (
    <div className="write-story">
      {loading ? (
        <p>Loading story...</p>
      ) : story ? (
        <div>
          <h1>Edit {story.title}</h1>
          {/* Display chapter links */}
          <div>
            {Object.keys(story.chapters).length > 0 ? (
              <ul>
                {Object.keys(story.chapters).map((chapterKey, index) => (
                  <li key={index}>
                    <button onClick={() => handleChapterSelect(chapterKey)}>
                      {chapterKey.replace('_', ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No chapters available.</p>
            )}
            {/* Button to create a new chapter */}
            <button onClick={handleCreateNewChapter}>Create New Chapter</button>
          </div>

          {/* Quill text editor */}
          <ReactQuill
            ref={quillRef}
            value={editorContent}
            onChange={handleEditorChange}
            theme="snow"
            placeholder="Start writing your chapter..."
            modules={{
              toolbar: [
                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['bold', 'italic', 'underline'],
                ['link'],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                ['image'],
                ['blockquote'],
                ['code-block'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean'],
              ],
            }}
          />

          {/* Save button */}
          <div className="save-button">
            <button onClick={handleSave}>Save Chapter</button>
          </div>
        </div>
      ) : (
        <p>Story not found.</p>
      )}
    </div>
  );
}

export default WriteStory;
