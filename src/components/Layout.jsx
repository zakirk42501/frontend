import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useGSAP(() => {
    // Initial load animation for layout
    gsap.fromTo('.app-layout', 
      { opacity: 0 }, 
      { opacity: 1, duration: 1, ease: 'power2.out' }
    );
    
    // Topbar slides down
    gsap.fromTo('.topbar', 
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)', delay: 0.2 }
    );
  }, []);

  // Page Transition on route change
  useGSAP(() => {
    if (mainRef.current) {
      const children = Array.from(mainRef.current.children);
      if (children.length > 0) {
        gsap.fromTo(children, 
          { y: 20, opacity: 0, scale: 0.98 }, 
          { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
      }
    }
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="content-wrapper">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="main-content" ref={mainRef}>
          {children}
        </main>
      </div>
    </div>
  );
};
