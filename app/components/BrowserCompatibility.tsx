"use client";

import { useEffect, useState } from "react";

export default function BrowserCompatibility() {
  const [isOldBrowser, setIsOldBrowser] = useState(false);

  useEffect(() => {
    // Detect Samsung TV browser or other old browsers
    const userAgent = navigator.userAgent.toLowerCase();
    const isSamsungTV = userAgent.includes('tizen') || 
                        userAgent.includes('smarttv') || 
                        userAgent.includes('samsung');
    
    // Check for basic JavaScript features
    const hasModernFeatures = 
      typeof Promise !== 'undefined' &&
      typeof fetch !== 'undefined' &&
      typeof Map !== 'undefined' &&
      typeof Set !== 'undefined';

    if (isSamsungTV || !hasModernFeatures) {
      setIsOldBrowser(true);
      console.warn('Old browser detected:', userAgent);
    }
  }, []);

  if (!isOldBrowser) {
    return null;
  }

  return null /*(
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ff9800',
      color: 'white',
      padding: '16px',
      textAlign: 'center',
      zIndex: 9999,
      fontSize: '14px',
    }}>
      <strong>Hinweis:</strong> Ihr Browser wird möglicherweise nicht vollständig unterstützt. 
      Für die beste Erfahrung verwenden Sie bitte einen modernen Browser.
    </div>
  )*/;
}
