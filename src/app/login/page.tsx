'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        try {
            // First attempt to login
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // If invalid credentials, it might be a new user (for this demo's auto-provisioning)
                if (signInError.message.includes("Invalid login credentials")) {
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: { data: { name: email.split('@')[0] } }
                    });

                    if (signUpError) {
                        if (signUpError.message.includes("User already registered")) {
                            throw new Error("Sai mật khẩu (Tài khoản đã tồn tại).");
                        }
                        throw signUpError;
                    }

                    // Register in public.users 
                    if (signUpData.user) {
                        await supabase.from('users').insert({
                            id: signUpData.user.id,
                            email: email,
                            name: email.split('@')[0],
                            role: 'user'
                        });
                    }

                    if (!signUpData.session) {
                        setErrorMsg('Chưa thiết lập session. Vui lòng tắt "Confirm Email" trong Supabase (Authentication -> Providers) hoặc kiểm tra hộp thư xác nhận để đăng nhập lại.');
                        return;
                    }

                    router.push('/');
                    return;
                } else {
                    throw signInError;
                }
            }

            // Success
            router.push('/');
        } catch (error: any) {
            console.error('Login error:', error);
            setErrorMsg(error.message || 'Đăng nhập thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000 // Cover the layout entirely for demonstration purposes
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Mix Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Factory Quality Monitoring System</p>
                </div>

                {errorMsg && (
                    <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="packing@dds.com"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : <><LogIn size={18} /> Đăng Nhập</>}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Testing? Just click Login above to enter the dashboard.
                </div>
            </div>
        </div>
    );
}
