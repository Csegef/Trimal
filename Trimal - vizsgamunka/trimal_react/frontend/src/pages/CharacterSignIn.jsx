import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const CharacterSignIn = () => {
    const navigate = useNavigate();

    // Form states
    const [loginIdentifier, setLoginIdentifier] = useState(""); // Can be username or email
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Check for existing session
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/maingame');
        }

        const lastLogin = localStorage.getItem('lastLogin');
        if (lastLogin) {
            setLoginIdentifier(lastLogin);
        }
    }, [navigate]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginIdentifier || !password) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginIdentifier, password }),
            });
            const data = await response.json();

            if (data.success) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify({
                    username: data.user.nickname,
                    email: data.user.email,
                    character: {
                        className: data.character ? data.character.specie_name : 'Unknown',
                        hairStyle: data.character ? data.character.hair_style : 0,
                        beardStyle: data.character ? data.character.beard_style : 0
                    }
                }));
                localStorage.setItem('lastLogin', loginIdentifier);

                navigate('/maingame');
            } else {
                setError(data.message || "Login failed");
            }

        } catch (err) {
            console.error("Login Error:", err);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <MainLayout>
            <div className="w-full max-w-md backdrop-blur-sm p-6 md:p-8 rounded-2xl border-4 shadow-xl bg-stone-900/50 border-stone-700">
                <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase text-center border-b-2 border-stone-600 pb-4 mb-6 tracking-wide">
                    Login
                </h1>

                {error && (
                    <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-3 mb-4 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-stone-300 font-bold uppercase tracking-wider text-sm">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                            placeholder="Enter username or email"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-stone-300 font-bold uppercase tracking-wider text-sm">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-900 border-2 border-stone-700 rounded text-amber-100 focus:border-amber-600 focus:outline-none transition-colors"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded text-base uppercase shadow-[0_4px_0_rgb(21,87,36)] active:shadow-none active:translate-y-1 transition-all border-2 border-green-800 mt-2"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-stone-400 text-sm">
                    <p>
                        Don't have a character yet?{" "}
                        <Link to="/class-selection" className="text-amber-400 hover:text-amber-300 font-bold underline decoration-2 underline-offset-2">
                            Create one here!
                        </Link>
                    </p>
                </div>

                {/* TODO: BACKEND - Remove this Dev Helper Section when backend is ready */}
                <div className="mt-8 pt-4 border-t border-stone-700 text-center">
                    <p className="text-stone-500 text-xs italic mb-2">Development Tools</p>
                    <button
                        onClick={() => {
                            const data = localStorage.getItem('userData');
                            if (data) {
                                const parsed = JSON.parse(data);
                                parsed.isVerified = true;
                                localStorage.setItem('userData', JSON.stringify(parsed));
                                alert("User manually verified for testing!");
                            } else {
                                alert("No user to verify!");
                            }
                        }}
                        className="text-xs text-stone-400 hover:text-stone-200 underline"
                    >
                        [Dev] Force Verify Current User
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default CharacterSignIn;
