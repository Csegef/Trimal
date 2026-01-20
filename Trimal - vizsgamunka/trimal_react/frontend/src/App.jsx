import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClassSelection from './pages/ClassSelection';
import CharacterCreator from './pages/CharacterCreator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClassSelection />} />
        <Route path="/create" element={<CharacterCreator />} />
      </Routes>
    </Router>
  );
}

export default App;
