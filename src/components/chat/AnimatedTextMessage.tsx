import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AnimatedTextMessageProps {
  text: string;
  isLatestMessage?: boolean;
}

export function AnimatedTextMessage({ text, isLatestMessage }: AnimatedTextMessageProps) {
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

    const animationSpeed = isLatestMessage === false ? 1 : Math.max(5, 50 - Math.floor(safeText.length / 20));
    const timePerChar = animationSpeed; // Milliseconds per character

    if (timestamp - lastUpdateTimeRef.current > timePerChar) {
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
  }, [safeText, isLatestMessage]);

  useEffect(() => {
    const wordCount = safeText.split(/\s+/).filter(word => word.length > 0).length;

    if (isLatestMessage && wordCount < 10) {
      setDisplayedText(safeText);
      animationIndexRef.current = safeText.length; // Ensure index is at end
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return; // No animation for short latest messages
    }

    // Aggressive reset: If the new text is not a simple continuation of the currently displayed text, reset.
    // This handles cases where code blocks appear or text is inserted/modified in non-append ways.
    // Removed aggressive reset as it caused text to disappear during streaming.
    if (animationIndexRef.current < safeText.length) {
      // If text is longer and starts with current displayed, continue from current index
      // No need to reset animationIndexRef.current here, it's already at the correct position
    }

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
  }, [safeText, isLatestMessage, animate]);

  return (
    <div className="whitespace-pre-wrap">
      {displayedText}
      {isLatestMessage && displayedText.length < safeText.length && (
        <span className="animate-blink">|</span>
      )}
    </div>
  );
}
