import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateListing from './pages/CreateListing'
import ListingDetail from './pages/ListingDetail'
import Profile from './pages/Profile'
import Inbox from './pages/Inbox'
import RemixStudio from './pages/RemixStudio'

function App() {
  return (
    <>
      <Navbar />
    <Routes>
      <Route path="/"               element={<Home />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/listings/new"   element={<CreateListing />} />
      <Route path="/listings/:id"   element={<ListingDetail />} />
      <Route path="/profile"        element={<Profile />} />
      <Route path="/inbox"          element={<Inbox />} />
      <Route path="/remix/studio"   element={<RemixStudio />} />
    </Routes>
    </>
  );
}

export default App;
