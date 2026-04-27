// ==========================================
// Fájl: Fő Applikáció (App)
// Cél: A React router és a globális útvonalak (route) definíciója.
//
// Ez fűzi össze az összes komponenst, és mondja meg, melyik link melyik oldalt töltse be.
// ==========================================
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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import Inventory from './pages/Inventory';
import Shop from './pages/Shop';
import CaveStation from './pages/CaveStation';
import ShamanStation from './pages/ShamanStation';
import ActiveQuestWaitView from './pages/ActiveQuestWaitView';
import FightPlaceholder from './pages/FightPlaceholder';
import DungeonStation from './pages/DungeonStation';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterSignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/class-selection" element={<ClassSelection />} />
        <Route path="/create" element={<CharacterCreator />} />
        <Route path="/registration" element={<CharacterRegistration />} />
        <Route path="/maingame" element={<MainGame />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/shop/:shopType" element={<Shop />} />
        <Route path="/mysterious-cave" element={<CaveStation />} />
        <Route path="/shamans-hut" element={<ShamanStation />} />
        <Route path="/active-quest" element={<ActiveQuestWaitView />} />
        <Route path="/fight" element={<FightPlaceholder />} />
        <Route path="/dungeons" element={<DungeonStation />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/Terms" element={<TermsAndConditions />} />
        <Route path="/Privacy" element={<PrivacyPolicy />} />
        <Route path="/About" element={<About />} />
        <Route path="/verify" element={<EmailVerification />} />
      </Routes>
    </Router>
  );
}

export default App;
