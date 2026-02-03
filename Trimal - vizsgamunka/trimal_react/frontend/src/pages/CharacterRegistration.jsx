import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const CharacterRegistration = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Karakteralkotásból átjövő adatok
  const selectedClass = state?.selectedClass || {
    id: "neanderthal",
    name: "Neanderthal",
    prefix: "n",
  };
  const hairIndex = state?.hairIndex || 0;
  const beardIndex = state?.beardIndex || 0;

  // Form state-ek
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  // Validáció függvény
  const validateForm = () => {
    const newErrors = {};

    // Felhasználónév validáció
    if (!username.trim()) {
      newErrors.username = "You have to sign a username!";
    } else if (username.length < 3) {
      newErrors.username = "The username have to be atleast 3 character long!";
    } else if (username.length > 20) {
      newErrors.username = "The username have to be at most 20 character long!";
    }

    // Email validáció
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "You have to sign an email!";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Incorrect email format!";
    }

    // Jelszó validáció
    if (!password) {
      newErrors.password = "You have to sign a password!";
    } else if (password.length < 8) {
      newErrors.password = "The password have to be atleast 8 character long!";
    }

    // Jelszó megerősítés validáció
    if (!confirmPassword) {
      newErrors.confirmPassword = "You have to confirm your password again!";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "The two passwords doesn't match!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //   // Regisztráció kezelése
  //   const handleRegister = async () => {
  //     if (!validateForm()) {
  //       return;
  //     }

  //     // BACKEND INTEGRÁCIÓS PONT
  //     // Itt kell majd meghívni a backend API-t
  //     const registrationData = {
  //       username,
  //       email,
  //       password,
  //       character: {
  //         class: selectedClass.id,
  //         className: selectedClass.name,
  //         hairStyle: hairIndex,
  //         beardStyle: beardIndex,
  //       },
  //     };

  //     console.log("Registration Data:", registrationData);

  //     // PLACEHOLDER - Backend hívás után majd ide jön a navigáció
  //     alert("Sikeres regisztráció! (Backend integráció függőben)");
  //     // navigate("/game"); // Később ez lesz a játék főképernyő
  //   };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const registrationData = {
      username,
      email,
      password,
      character: {
        class: selectedClass.id,
        className: selectedClass.name,
        hairStyle: hairIndex,
        beardStyle: beardIndex,
      },
      isVerified: false, // New users are not verified by default
    };

    try {
      // Backend hívás (később fog működni)
      // TODO: BACKEND - This is where the real registration endpoint will be called
      /*
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert("Registration successful! Please check your email (" + email + ") to verify your account.");
        navigate("/"); // Redirect to Login
      } else {
        alert(data.message);
      }
      */

    } catch (error) {
      console.error('Registration error:', error);
      alert('Something happened during registration!');
    }
  };
  return (
    <MainLayout>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 md:gap-6 items-start justify-center p-3 md:p-4">

        {/* Bal oldal: Karakter összefoglaló */}
        <div className="w-full lg:w-100 shrink-0 backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl border-4 shadow-xl bg-stone-900/50 border-stone-700">
          <h2 className="text-xl md:text-2xl font-black text-amber-400 uppercase text-center border-b-2 border-stone-600 pb-2 md:pb-3 mb-4">
            Your Character
          </h2>

          {/* Karakter mini preview */}
          <div className="relative w-full aspect-square max-w-70 mx-auto bg-stone-900/50 rounded-xl border-2 border-stone-700 shadow-lg overflow-hidden mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Base Layer */}
              <img
                src={`./src/assets/design/character/base_character/${selectedClass.prefix}_base.png`}
                alt="Base Character"
                className="absolute z-0 h-full w-auto object-contain"
              />

              {/* Hair Layer */}
              {hairIndex > 0 && (
                <img
                  src={`/src/assets/design/character/hair/${selectedClass.prefix}-hair-${hairIndex}.png`}
                  alt="Hair"
                  className="absolute z-10 h-full w-auto object-contain"
                />
              )}

              {/* Beard Layer */}
              {beardIndex > 0 && (
                <img
                  src={`/src/assets/design/character/beard/${selectedClass.prefix}-beard-${beardIndex}.png`}
                  alt="Beard"
                  className="absolute z-20 h-full w-auto object-contain"
                />
              )}
            </div>
          </div>

          {/* Karakter adatok */}
          <div className="space-y-2 text-stone-300">
            <div className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
              <span className="font-bold text-sm uppercase tracking-wider">Species:</span>
              <span className="text-amber-400 font-bold">{selectedClass.name}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
              <span className="font-bold text-sm uppercase tracking-wider">Hair:</span>
              <span className="text-amber-400 font-bold">
                {hairIndex === 0 ? "Bald" : `Style ${hairIndex}`}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
              <span className="font-bold text-sm uppercase tracking-wider">Beard:</span>
              <span className="text-amber-400 font-bold">
                {beardIndex === 0 ? "Shaved" : `Style ${beardIndex}`}
              </span>
            </div>
          </div>
        </div>

        {/* Jobb oldal: Regisztrációs form */}
        <div className="grow w-full max-w-md backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl border-4 shadow-xl bg-stone-900/50 border-stone-700">
          <h2 className="text-xl md:text-2xl font-black text-amber-400 uppercase text-center border-b-2 border-stone-600 pb-2 md:pb-3 mb-4 md:mb-6">
            Create Account
          </h2>

          <div className="space-y-4">
            {/* Felhasználónév */}
            <div className="space-y-2">
              <label className="text-stone-300 font-bold uppercase tracking-wider text-sm md:text-base">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                placeholder="Enter username"
              />
              {errors.username && (
                <p className="text-red-400 text-sm font-semibold">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-stone-300 font-bold uppercase tracking-wider text-sm md:text-base">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm font-semibold">{errors.email}</p>
              )}
            </div>

            {/* Jelszó */}
            <div className="space-y-2">
              <label className="text-stone-300 font-bold uppercase tracking-wider text-sm md:text-base">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                placeholder="Min. 8 characters"
              />
              {errors.password && (
                <p className="text-red-400 text-sm font-semibold">{errors.password}</p>
              )}
            </div>

            {/* Jelszó megerősítés */}
            <div className="space-y-2">
              <label className="text-stone-300 font-bold uppercase tracking-wider text-sm md:text-base">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm font-semibold">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Gombok */}
            <div className="mt-6 flex gap-3 md:gap-4">
              <button
                onClick={() => navigate("/create", { state: { selectedClass } })}
                className="flex-1 py-2 md:py-3 bg-stone-600 hover:bg-stone-500 text-stone-100 font-bold rounded text-sm md:text-base uppercase border border-stone-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleRegister}
                className="flex-2 py-2 md:py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded text-sm md:text-base uppercase shadow-[0_3px_0_rgb(21,87,36)] md:shadow-[0_4px_0_rgb(21,87,36)] active:shadow-none active:translate-y-1 transition-all border-2 border-green-800"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CharacterRegistration;