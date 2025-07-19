"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}

interface NavigationProps {
  navItems: NavItem[];
}

export function Navigation({ navItems }: NavigationProps) {
  const pathname = usePathname();
  const [underlineStyle, setUnderlineStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLElement>(null);
  const refs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  useEffect(() => {
    const updateUnderline = () => {
      const activeTab = refs.current.get(pathname);
      const navElement = navRef.current;

      if (activeTab && navElement) {
        // Get the nav element's position relative to its container
        const navRect = navElement.getBoundingClientRect();
        const activeRect = activeTab.getBoundingClientRect();
        
        // Calculate position relative to the nav container
        const relativeLeft = activeRect.left - navRect.left;
        
        setUnderlineStyle({
          left: relativeLeft,
          width: activeTab.offsetWidth,
          opacity: 1,
        });
      } else {
        setUnderlineStyle({ left: 0, width: 0, opacity: 0 });
      }
    };

    // Initial update
    updateUnderline();

    // Update on window resize
    const handleResize = () => {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(updateUnderline);
    };

    window.addEventListener('resize', handleResize);
    
    // Also observe the navigation element for any size changes
    const navElement = navRef.current;
    if (navElement) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(updateUnderline);
      });
      observer.observe(navElement);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname, navItems]);

  return (
    <nav ref={navRef} className="relative flex items-center text-center text-[13px] font-medium">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            ref={(el) => {
              if (el) refs.current.set(item.href, el);
            }}
            key={item.href}
            href={item.href}
            className={`flex items-center h-full rounded-lg rounded-t-none gap-1.5 px-3 mx-1 pt-1 pb-2  transition-all duration-300 ease-in-out transition-colors ${
              isActive ? "text-primary bg-gradient-to-t from-primary/20 to-secondary" : "text-foreground/30 hover:text-foreground/40"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
            {item.name}
          </Link>
        );
      })}
      <div
        className="z-102 absolute -bottom-[0.7vh] h-[10%] bg-gradient-to-t from-primary/80 via-primary/40 to-primary/0 rounded-t-lg transition-all duration-300 ease-in-out"
        style={underlineStyle}
      />
    </nav>
  );
} 