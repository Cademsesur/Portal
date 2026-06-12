'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border border-border bg-card text-foreground shadow-lg',
          description: 'text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary-800',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton:
            'border-border bg-card text-muted-foreground hover:bg-muted',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
