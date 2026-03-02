import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useTransferCart } from '../../context/TransferCartContext';

interface CartBadgeProps {
  onClick: () => void;
}

export const CartBadge: React.FC<CartBadgeProps> = ({ onClick }) => {
  const { totalItems, phase, isCartEmpty, pendingCount, allTransfersCompleted, lastAddedFeedback } = useTransferCart();
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [bounce, setBounce] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lastAddedFeedback) {
      const text = `${lastAddedFeedback.itemName} T.${lastAddedFeedback.size}${lastAddedFeedback.quantity > 1 ? ` x${lastAddedFeedback.quantity}` : ''}`;
      setToastText(text);
      setShowToast(true);
      setBounce(true);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);

      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = setTimeout(() => setBounce(false), 600);
    }
  }, [lastAddedFeedback]);

  if (isCartEmpty) return null;

  const badgeColor =
    phase === 'ready_to_sell'
      ? 'bg-green-600'
      : phase === 'tracking' || phase === 'submitted'
        ? 'bg-yellow-500'
        : 'bg-primary';

  const label =
    phase === 'ready_to_sell'
      ? 'Listo para vender'
      : phase === 'tracking'
        ? `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`
        : `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Mini-toast */}
      {showToast && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[220px]">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{toastText}</span>
        </div>
      )}

      {/* Badge button */}
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white transition-all hover:scale-105 active:scale-95 ${badgeColor} ${bounce ? 'animate-bounce' : ''}`}
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="text-sm font-semibold">{label}</span>
        {allTransfersCompleted && phase === 'ready_to_sell' && (
          <span className="ml-1 animate-pulse">!</span>
        )}
      </button>
    </div>
  );
};
