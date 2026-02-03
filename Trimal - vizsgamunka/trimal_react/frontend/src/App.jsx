import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClassSelection from './pages/ClassSelection';
import CharacterCreator from './pages/CharacterCreator';
import CharacterRegistration from './pages/CharacterRegistration';
import TermsAndConditions from './pages/TermAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MainGame from './pages/MainGame'
import About from './pages/About';
import CharacterSignIn from './pages/CharacterSignIn';
import EmailVerification from './pages/EmailVerification';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterSignIn />} />
        <Route path="/class-selection" element={<ClassSelection />} />
        <Route path="/create" element={<CharacterCreator />} />
        <Route path="/registration" element={<CharacterRegistration />} />
        <Route path="/maingame" element={<MainGame />} />
        <Route path="/Terms" element={<TermsAndConditions />} />
        <Route path="/Privacy" element={<PrivacyPolicy />} />
        <Route path="/About" element={<About />} />
        <Route path="/verify" element={<EmailVerification />} />
      </Routes>
    </Router>
  );
}

export default App;
