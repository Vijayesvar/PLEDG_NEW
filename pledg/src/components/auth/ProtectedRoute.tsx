"use client";

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/stores/store';
import { Provider } from 'react-redux';
import { store } from '@/stores/store';
import Skeleton from "@/components/ui/Skeleton";
import { useEffect, useState } from 'react';
import { checkAuth } from '@/stores/authSlice';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRouteContent({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      setHasCheckedAuth(true);
    });
  }, [dispatch]);

  useEffect(() => {
    // Only redirect if we've completed the auth check and there's no user
    if (hasCheckedAuth && !loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router, hasCheckedAuth]); 

  return <>{children}</>;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <Provider store={store}>
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Provider>
  );
} 