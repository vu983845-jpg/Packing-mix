'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUser = () => {
            try {
                const isAuth = window.localStorage.getItem('demo_auth') === 'true';

                if (!isAuth && pathname !== '/login') {
                    router.push('/login');
                } else if (isAuth && pathname === '/login') {
                    router.push('/');
                }
            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa' }}>
                <p style={{ color: '#64748b' }}>Đang tải hệ thống...</p>
            </div>
        );
    }

    return <>{children}</>;
}
