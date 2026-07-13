import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import JournalPage from './pages/JournalPage';
import MoodTracker from './pages/MoodTracker';
import SelfCarePage from './pages/SelfCarePage';
import ResourcesPage from './pages/ResourcesPage';
import EmergencyPage from './pages/EmergencyPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="mood" element={<MoodTracker />} />
          <Route path="self-care" element={<SelfCarePage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
