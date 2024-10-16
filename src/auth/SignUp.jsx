import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase_setup/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUp = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const defaultPfpUrl = 'https://firebasestorage.googleapis.com/v0/b/talehub-7275d.appspot.com/o/pfps%2Fdefaultpfp.png?alt=media&token=aaf12a9a-b10a-46f8-91a5-b79221ac9ade';

  const handleSignUp = async (e) => {
    e.preventDefault();
  
    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Update the user's profile with name and default profile picture
      await updateProfile(user, {
        displayName: name,
        photoURL: defaultPfpUrl,
      });
  
      // Format the current date as "October, 2024"
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
  
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        username,
        email,
        pfp: defaultPfpUrl, // Store default profile picture
        createdAt: formattedDate, // Store the formatted date
      });
  
      // Show success toast message
      toast.success('Sign up successful! Redirecting to login...');
  
      // Clear form and navigate to login page
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        navigate('/login'); // Redirect to login page
      }, 2000);
    } catch (error) {
      console.error('Sign up failed:', error);
      toast.error('Sign up failed. Please try again.');
    }
  };
  

  return (
    <div>
      <h2>Create and account with TaleHub</h2>
      <form onSubmit={handleSignUp}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default SignUp;
