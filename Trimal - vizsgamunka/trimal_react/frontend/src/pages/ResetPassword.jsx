// ==========================================
// Fájl: Jelszó Visszaállítás
// Cél: A kiküldött token segítségével véglegesíti az új jelszót.
// ==========================================
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenParam = queryParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError("Invalid password reset link.");
        }
    }, [location]);

    const calculatePasswordStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
        return strength;
    };

    const getStrengthLabel = (strength) => {
        if (strength <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-400" };
        if (strength === 2) return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-400" };
        if (strength >= 3) return { label: "Strong", color: "bg-green-500", text: "text-green-400" };
        return { label: "", color: "bg-transparent", text: "" };
    };

    const passStrength = calculatePasswordStrength(password);
    const strengthInfo = getStrengthLabel(passStrength);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (passStrength < 3) {
            setError("Password must contain at least one uppercase letter, one number, and one special character.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setTimeout(() => navigate('/'), 3000);
            } else {
                setError(data.message || "Failed to reset password.");
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
                    Reset Password
                </h1>

                {error && (
                    <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-3 mb-4 rounded text-sm">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-900/50 border-l-4 border-green-500 text-green-200 p-3 mb-4 rounded text-sm">
                        {message} Redirecting to login...
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-stone-300 uppercase tracking-wider text-sm">
                                    New Password
                                </label>
                                {password && (
                                    <span className={`text-xs uppercase ${strengthInfo.text}`}>
                                        {strengthInfo.label}
                                    </span>
                                )}
                            </div>

                            {password && (
                                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden flex mb-1">
                                    <div className={`h-full ${strengthInfo.color} transition-all duration-300`} style={{ width: `${(passStrength / 4) * 100}%` }}></div>
                                </div>
                            )}

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3 bg-stone-900 border-2 rounded text-amber-100 focus:outline-none transition-all duration-300 ${error ? 'border-red-500 focus:border-red-500 bg-red-950/30' : 'border-stone-700 focus:border-amber-600'}`}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-stone-300 uppercase tracking-wider text-sm">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 bg-stone-900 border-2 rounded text-amber-100 focus:outline-none transition-all duration-300 ${error ? 'border-red-500 focus:border-red-500 bg-red-950/30' : 'border-stone-700 focus:border-amber-600'}`}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 ${loading ? 'bg-stone-600' : 'bg-green-700 hover:bg-green-600'} text-white font-bold rounded text-base uppercase shadow-[0_4px_0_rgb(21,87,36)] active:shadow-none active:translate-y-1 transition-all border-2 border-green-800 mt-2`}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-stone-400 text-sm">
                    <p>
                        <Link to="/" className="text-amber-400 hover:text-amber-300 underline decoration-2 underline-offset-2">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};

export default ResetPassword;
