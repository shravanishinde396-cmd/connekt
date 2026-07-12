import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';


export const PageTransition: React.FC<{ children: React.ReactNode } & HTMLMotionProps<'div'>> = ({
  children,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number } & HTMLMotionProps<'div'>> = ({
  children,
  delay = 0,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SlideIn: React.FC<{ children: React.ReactNode; direction?: 'up' | 'down' | 'left' | 'right'; delay?: number } & HTMLMotionProps<'div'>> = ({
  children,
  direction = 'up',
  delay = 0,
  ...props
}) => {
  const getOffset = () => {
    switch (direction) {
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
      case 'up':
      default:
        return { y: 20 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getOffset() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number } & HTMLMotionProps<'div'>> = ({
  children,
  delay = 0,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
