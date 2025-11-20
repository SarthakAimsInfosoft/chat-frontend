import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";

export default function App() {
  const [user, setUser] = useState(localStorage.getItem("user"));

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/chat" /> : <Login onLogin={(u) => {
              setUser(u);
              localStorage.setItem("user", u);
            }} />
          }
        />

        {/* Register Page */}
        <Route
          path="/register"
          element={user ? <Navigate to="/chat" /> : <Register />}
        />

        {/* Chat Page */}
        <Route
          path="/chat"
          element={
            user ? <Chat username={user} /> : <Navigate to="/login" />
          }
        />

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
