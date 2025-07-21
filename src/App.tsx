import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CreatePost from './components/CreatePost';
import BrowsePosts from './components/BrowsePosts';
import Profile from './components/Profile';
import ChatPage from './components/ChatPage';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="browse-posts" element={<BrowsePosts />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:userId" element={<ChatPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
