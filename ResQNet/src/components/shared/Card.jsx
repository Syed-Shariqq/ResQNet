import { createElement } from 'react';

export default function Card({
  as = 'section',
  accent = 'none',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'card',
    accent !== 'none' ? `card--accent-${accent}` : '',
    interactive ? 'card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(as, { className: classes, ...props }, children);
}
