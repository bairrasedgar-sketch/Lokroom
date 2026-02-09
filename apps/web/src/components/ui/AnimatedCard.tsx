/**
 * AnimatedCard Component
 *
 * Carte animée avec Framer Motion pour les listings et autres contenus.
 * Optimisée pour 60fps avec animations fluides.
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { staggerItem } from '@/lib/animations/variants';
import { ReactNode } from 'react';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /**
   * Active l'animation au survol
   * @default true
   */
  enableHover?: boolean;
  /**
   * Utilise l'animation stagger (pour les listes)
   * @default false
   */
  useStagger?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

/**
 * Carte animée avec effet de survol et support stagger
 */
export function AnimatedCard({
  children,
  enableHover = true,
  useStagger = false,
  className = '',
  ...props
}: AnimatedCardProps) {
  const variants = useStagger ? staggerItem : undefined;

  return (
    <motion.div
      variants={variants}
      whileHover={enableHover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Conteneur de cartes avec animation stagger
 */
interface AnimatedCardGridProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedCardGrid({ children, className = '' }: AnimatedCardGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
