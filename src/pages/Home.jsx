import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth, storage } from '../firebase_setup/firebase';  // Import Firestore, Auth, and Storage
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import Modal from 'react-modal';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Set app element for accessibility
Modal.setAppElement('#root');

function Home() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [plot, setPlot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [user] = useAuthState(auth);  // Get current authenticated user

  // Fetch stories from 'stories' collection
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'stories'));
        const storiesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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
  }, []);

  // Handle story submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image || !title || !plot) {
      toast.error("All fields are required.");
      return;
    }

    setUploading(true);

    try {
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `covers/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      // Monitor the upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          throw error;
        }, 
        async () => {
          // Get download URL after successful upload
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Add new story to user's 'myStories' collection
          const userStoriesRef = collection(db, 'users', user.uid, 'myStories');
          await addDoc(userStoriesRef, {
            image: downloadURL,  // Save download URL
            title,
            plot,
            createdAt: new Date(),
            creatorId: user.uid // Save creator id for later use
          });

          toast.success("Story added successfully!");

          // Reset form
          setImage(null);
          setTitle('');
          setPlot('');
          setModalIsOpen(false);
        }
      );
    } catch (error) {
      console.error("Error uploading image or adding story: ", error);
      toast.error("Failed to add story");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="home">

      {loading ? (
        <p>Loading stories...</p>
      ) : stories.length === 0 ? (
        <p>No stories available.</p>
      ) : (
        <div>
          <h2>Stories</h2>
          <ul>
            {stories.map((story) => (
              <Link to={`/story/${story.id}`} key={story.id}>
                <img src={story.image} alt={story.title} width={100} />
                <h3>{story.title}</h3>
              </Link>
            ))}
          </ul>
        </div>
      )}

      {/* Button to open modal */}
      <button onClick={() => setModalIsOpen(true)}>Start Writing</button>

      {/* Modal for adding a new story */}
      <Modal 
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Write a Story"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <h2>Write a Story</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <div>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title"
            />
          </div>

          <div>
            <label>Plot</label>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              placeholder="Enter plot details"
            />
          </div>

          <div className="modal-buttons">
            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Submit"}
            </button>
            <button type="button" onClick={() => setModalIsOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default Home;
