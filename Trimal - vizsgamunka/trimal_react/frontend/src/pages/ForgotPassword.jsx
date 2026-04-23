import React, { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!email) {
            setError("Please enter your email.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
            } else {
                setError(data.message || "Failed to send reset email.");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="w-full max-w-md backdrop-blur-sm p-6 md:p-8 rounded-2xl border-4 shadow-xl bg-stone-900/50 border-stone-700">
                <h1 className="text-3xl md:text-4xl text-amber-400 uppercase text-center border-b-2 border-stone-600 pb-4 mb-6 tracking-wide">
                    Forgot Password
                </h1>

                {error && (
                    <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-3 mb-4 rounded text-sm">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-900/50 border-l-4 border-green-500 text-green-200 p-3 mb-4 rounded text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-stone-300 uppercase tracking-wider text-sm">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 bg-stone-900 border-2 rounded text-amber-100 focus:outline-none transition-all duration-300 ${error ? 'border-red-500 focus:border-red-500 bg-red-950/30' : 'border-stone-700 focus:border-amber-600'}`}
                            placeholder="Enter your email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 ${loading ? 'bg-stone-600' : 'bg-amber-700 hover:bg-amber-600'} text-white font-bold rounded text-base uppercase shadow-[0_4px_0_rgb(146,64,14)] active:shadow-none active:translate-y-1 transition-all border-2 border-amber-800 mt-2`}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center text-stone-400 text-sm">
                    <p>
                        Remembered your password?{" "}
                        <Link to="/" className="text-amber-400 hover:text-amber-300 underline decoration-2 underline-offset-2">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};

export default ForgotPassword;
