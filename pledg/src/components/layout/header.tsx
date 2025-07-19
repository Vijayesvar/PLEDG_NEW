"use client";

import { Codesandbox, CreditCard, LayoutDashboard, User, Wallet, LogOut, ChevronDown } from 'lucide-react';
import Link from "next/link";
import { Navigation } from './navigation';
import { Button } from '../ui/button';
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/stores/store';
import { logoutReducer } from '@/stores/authSlice';
import { cn } from '@/lib/utils';
import { Provider } from "react-redux";
import { store } from "@/stores/store";
import { useRouter } from 'next/navigation';
import { logout } from '@/api/auth';
function HeaderContent() {
  const navItems = [
    { name: "Explore", icon: <Codesandbox size={21} />, href: "/" },
    { name: "Apply Loan", icon: <CreditCard size={21} />, href: "/apply-loan" },
    { name: "Dashboard", icon: <LayoutDashboard size={21} />, href: "/dashboard" },
  ];

  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dropdownAnimation, setDropdownAnimation] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (showUserDropdown) {
      setTimeout(() => setDropdownAnimation('dropdown-animate-in'), 10);
    } else if (dropdownAnimation) {
      setDropdownAnimation('dropdown-animate-out');
      setTimeout(() => {
        setDropdownAnimation('');
      }, 180);
    }
  }, [showUserDropdown, dropdownAnimation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && typeof (window as { ethereum?: unknown }).ethereum !== 'undefined') {
      try {
        const ethereum = (window as { ethereum?: unknown }).ethereum as { request: (args: { method: string }) => Promise<string[]> };
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User rejected connection or other error:", error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to connect.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      dispatch(logoutReducer());
      setShowUserDropdown(false);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <>
      <div className="fixed shadow-[4px_4px_4px_0px_rgba(0,0,0,0.008)] top-0 left-0 py-[0.6vh] right-0 bg-secondary z-92 text-foreground px-4 w-full flex items-center justify-between gap-16">
        <div className='flex items-center gap-6'>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/pledg.svg" alt="Pledg Logo" width={32} height={32} />
          </Link>
          
          <Navigation navItems={navItems} />
        </div>
        <div className="flex items-center gap-4">
          {account ? (
            <div className="text-[12px] py-[0.55vh] px-2 bg-gradient-to-t from-primary to-primary/88 border border-primary/20 rounded-sm text-white flex items-center gap-2">
              <Wallet size={20} />
              <span className="truncate max-w-[7rem]">{account}</span>
            </div>
          ) : (
            <Button
              className="text-[12px] py-[0.55vh] px-2 bg-gradient-to-t from-primary to-primary/88 border border-primary/20 rounded-sm flex text-white items-center gap-2"
              onClick={connectWallet}
            >
              <Wallet size={20} />
              Connect your wallet
            </Button>
          )}
          <div className='h-6 w-[2px] bg-black/10'></div>
          
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 text-foreground/40 hover:text-foreground/50 cursor-pointer transition-colors"
            >
              <User size={16} />
              <span className="text-[0.83rem] max-w-[5rem] truncate font-medium text-foreground/70">
                {getUserDisplayName()}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-foreground/40 transition-transform duration-200",
                  showUserDropdown && "rotate-180"
                )}
              />
            </button>
            
            {showUserDropdown && (
              <div
                className={cn(
                  "absolute right-0 mt-2 w-42 bg-secondary border border-header/50 rounded-lg shadow-lg z-50",
                  dropdownAnimation
                )}
                style={{
                  transition: 'opacity 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.18s cubic-bezier(0.4,0,0.2,1)',
                  opacity: dropdownAnimation === 'dropdown-animate-in' ? 1 : 0,
                  transform: dropdownAnimation === 'dropdown-animate-in' ? 'translateY(0)' : 'translateY(-8px)',
                }}
              >
                <div className="p-3 border-b border-header/20">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-[0.83rem] truncate text-foreground">
                        {getUserDisplayName()}
                      </span>
                      {user?.email && (
                        <span className="text-xs truncate text-subtext">
                          {user?.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {user && (
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-foreground hover:bg-header/20 rounded-md transition-colors duration-150 cursor-pointer"
                    >
                      <LogOut size={14} className="text-subtext" />
                      <span className="text-[0.83rem]">Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <div className="fixed top-[6.3vh] left-0 w-full h-[1px] bg-header z-92"></div>     */}
    </>
  );
}

export default function Header() {
  return (
    <Provider store={store}>
      <HeaderContent />
    </Provider>
  );
}
