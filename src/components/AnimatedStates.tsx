'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './AnimatedStates.module.css';

export function LoadingSpinner() {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.spinner}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        Loading anime data...
      </motion.p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string, onRetry?: () => void }) {
  return (
    <motion.div 
      className={styles.container}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <AlertTriangle size={64} className={styles.errorIcon} />
      <h2>Oops! Something went wrong</h2>
      <p className={styles.textMuted}>{message || "We couldn't fetch the data."}</p>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryBtn}>
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export function SuccessState({ message }: { message: string }) {
  return (
    <motion.div 
      className={styles.container}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <CheckCircle size={64} color="var(--accent-secondary)" />
      <h2>Success</h2>
      <p className={styles.textMuted}>{message}</p>
    </motion.div>
  );
}
