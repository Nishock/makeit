import React from 'react';
import background from '../assets/auth_bg_placeholder_1781704747161.png';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-split-wrapper">
      {/* Visual Branding Side */}
      <div className="auth-visual-side">
        <div className="auth-visual-bg" style={{ backgroundImage: `url(${background})` }} />
        <div className="auth-visual-overlay" />
        
        {/* Floating Glassmorphic 3D Spheres */}
        <div className="floating-circle floating-circle-1"></div>
        <div className="floating-circle floating-circle-2"></div>

        <div className="auth-visual-content">
          <div className="auth-visual-logo">
            <div className="auth-visual-logo-box">✓</div>
            <span>MakeIT</span>
          </div>

          <div className="auth-visual-main">
            <h2>Design. Plan.<br />Collaborate.</h2>
            <p>Experience a modern 3D task workspace tailored for professional developers and high-growth teams.</p>
          </div>

          <div className="auth-visual-footer">
            © 2026 MakeIT Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Form Interaction Side */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          {children}
        </div>
      </div>
    </div>
  );
}
