
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    const effectRan = React.useRef(false);

    useEffect(() => {
        if (effectRan.current === true) return;

        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('No verification token found.');
                return;
            }

            effectRan.current = true;

            try {
                const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('error');
                    setMessage(data.message);
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <MainLayout>
            <div className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-stone-900/50 rounded-xl border-4 border-stone-700 shadow-xl text-center">
                <h2 className="text-2xl font-black text-amber-400 uppercase mb-4">
                    Email Verification
                </h2>

                <div className={`p-4 rounded-lg mb-6 border-2 ${status === 'verifying' ? 'bg-blue-900/30 border-blue-500 text-blue-200' :
                    status === 'success' ? 'bg-green-900/30 border-green-500 text-green-200' :
                        'bg-red-900/30 border-red-500 text-red-200'
                    }`}>
                    <p className="text-lg font-bold">{message}</p>
                </div>

                {status === 'success' && (
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded uppercase shadow-[0_3px_0_rgb(21,87,36)] active:translate-y-1 active:shadow-none transition-all border-2 border-green-800"
                    >
                        Go to Login
                    </button>
                )}

                {status === 'error' && (
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-stone-600 hover:bg-stone-500 text-stone-100 font-bold rounded uppercase border border-stone-500 transition-colors"
                    >
                        Back to Login
                    </button>
                )}
            </div>
        </MainLayout>
    );
};

export default EmailVerification;
