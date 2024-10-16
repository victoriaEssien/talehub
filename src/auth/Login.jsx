import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase_setup/firebase';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Function to generate 'talehub-access-token'
  const generateAccessToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < chars.length; i++) { // Generates a 16-character token
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate and store the token in cookies
      const accessToken = generateAccessToken();
      Cookies.set(import.meta.env.VITE_ACCESS_TOKEN_ID, accessToken, { expires: 7 }); // Set cookie for 7 days

      // Show success toast and navigate to home page
      toast.success('Login successful! Redirecting to home...');
      setTimeout(() => {
        navigate('/home'); // Navigate to home page
      }, 2000);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <ToastContainer />
    </div>
  );
}

export default Login;
