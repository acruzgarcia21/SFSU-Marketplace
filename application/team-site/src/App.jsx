import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import VP from "./pages/VP";
import Home from "./pages/Home";
import About from "./pages/About";
import ListingDetails from "./pages/ListingDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import MyListings from "./pages/MyListings";

import MessagingPage from "./components/messaging-page.jsx";

import Alejandro from "./pages/Alejandro";
import Akash from "./pages/Akash";
import Gerious from "./pages/Gerious";
import JoshuaM from "./pages/JoshuaM";
import JoshuaO from "./pages/JoshuaO";
import Keith from "./pages/Keith";
import Krish from "./pages/Krish";
import Kyle from "./pages/Kyle";

function ProtectedRoute({ children }) {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/vp-search" element={<VP />} />
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/about" element={<About />} />
        <Route path="/listing/:id" element={<ListingDetails />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-listing"
          element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-listing/:id"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-listing"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <MyListings />
            </ProtectedRoute>
          }
        />

        <Route path="/alejandro" element={<Alejandro />} />
        <Route path="/akash" element={<Akash />} />
        <Route path="/gerious" element={<Gerious />} />
        <Route path="/joshua-m" element={<JoshuaM />} />
        <Route path="/joshua-o" element={<JoshuaO />} />
        <Route path="/keith" element={<Keith />} />
        <Route path="/krish" element={<Krish />} />
        <Route path="/kyle" element={<Kyle />} />
      </Routes>
    </BrowserRouter>
  );
} 