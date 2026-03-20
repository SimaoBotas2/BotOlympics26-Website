import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Leaderboard from './components/Leaderboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
