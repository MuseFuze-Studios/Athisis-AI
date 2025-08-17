import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AnimatedTextMessageProps {
  text: string;
}

export function AnimatedTextMessage({ text }: AnimatedTextMessageProps) {
  const animationIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const [displayedText, setDisplayedText] = useState('');

  // Ensure text is always a string
  const safeText = text || '';

  const animate = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }

    const animationSpeed = 5; // Milliseconds per character

    if (timestamp - lastUpdateTimeRef.current > animationSpeed) {
      if (animationIndexRef.current < safeText.length) {
        animationIndexRef.current++;
        setDisplayedText(safeText.substring(0, animationIndexRef.current));
        lastUpdateTimeRef.current = timestamp;
      } else {
        // Animation complete
        setDisplayedText(safeText); // Ensure full text is displayed
        cancelAnimationFrame(animationFrameRef.current as number);
        animationFrameRef.current = null;
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [safeText]);

  useEffect(() => {
    // Start animation if not already running and there's more text to display
    if (animationFrameRef.current === null && animationIndexRef.current < safeText.length) {
      lastUpdateTimeRef.current = 0; // Reset timer for new animation cycle
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setDisplayedText(safeText); // Ensure full text is displayed on unmount or text change
    };
  }, [safeText, animate]);

  return (
    <span className="whitespace-pre-wrap">
      {displayedText}
      {displayedText.length < safeText.length && (
        <span className="animate-blink">|</span>
      )}
    </span>
  );
}
