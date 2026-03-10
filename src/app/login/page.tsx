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
            // Simple credential check for demo purposes to avoid Supabase Auth Schema errors
            if (email === 'packing@dds.com' && password === 'Packing2026@') {
                // Determine if user exists in public.users to ensure DB integrity
                const { data: userData } = await supabase.from('users').select('*').eq('email', email).single();

                if (!userData) {
                    // Create the mock user in the public table if it doesn't exist yet
                    await supabase.from('users').insert({
                        id: '5a66bc48-d6f4-4274-bda9-dca4ae3a07fd', // hardcoded demo UUID
                        email: email,
                        name: 'Packing Team',
                        role: 'user'
                    });
                }

                // Set a simple localstorage flag to simulate being logged in
                window.localStorage.setItem('demo_auth', 'true');
                window.localStorage.setItem('demo_user', email);
                router.push('/');

            } else {
                throw new Error('Sai email hoặc mật khẩu!');
            }

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
