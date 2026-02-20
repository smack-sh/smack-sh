import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, type Variants } from 'framer-motion';
import React, { memo, type ReactNode, useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { FixedSizeList } from 'react-window';
import { Checkbox } from './Checkbox';
import { Label } from './Label';

export { Close as DialogClose, Root as DialogRoot } from '@radix-ui/react-dialog';

interface DialogButtonProps {
  type: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

export const DialogButton = memo(function DialogButton({ type, children, onClick, disabled }: DialogButtonProps) {
  return (
    <button
      className={classNames(
        'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200',
        type === 'primary'
          ? 'bg-accent text-white hover:bg-accent-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          : type === 'secondary'
            ? 'bg-smack-elements-background-depth-2 text-smack-elements-textPrimary hover:bg-smack-elements-background-depth-3 border border-smack-elements-borderColor'
            : 'bg-transparent text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});

export const DialogTitle = memo(({ className, children, ...props }: RadixDialog.DialogTitleProps) => {
  return (
    <RadixDialog.Title
      className={classNames('text-lg font-medium text-smack-elements-textPrimary flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </RadixDialog.Title>
  );
});

export const DialogDescription = memo(({ className, children, ...props }: RadixDialog.DialogDescriptionProps) => {
  return (
    <RadixDialog.Description
      className={classNames('text-sm text-smack-elements-textSecondary mt-1', className)}
      {...props}
    >
      {children}
    </RadixDialog.Description>
  );
});

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
};

export const dialogBackdropVariants = {
  closed: {
    opacity: 0,
    transition,
  },
  open: {
    opacity: 1,
    transition,
  },
} satisfies Variants;

export const dialogVariants = {
  closed: {
    x: '-50%',
    y: '-40%',
    scale: 0.96,
    opacity: 0,
    transition,
  },
  open: {
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1,
    transition,
  },
} satisfies Variants;

interface DialogProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onBackdrop?: () => void;
}

export const Dialog = memo(function Dialog({ children, className, showCloseButton = true, onClose, onBackdrop }: DialogProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay asChild>
        <motion.div
          className={classNames('fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-md')}
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogBackdropVariants}
          onClick={onBackdrop}
        />
      </RadixDialog.Overlay>
      <RadixDialog.Content asChild>
        <motion.div
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-smack-elements-background-depth-2 rounded-2xl shadow-2xl border border-smack-elements-borderColor z-[9999] w-[520px] max-w-[95vw] focus:outline-none',
            className,
          )}
          initial="closed"
          animate="open"
          exit="closed"
          variants={dialogVariants}
        >
          <div className="flex flex-col">
            {children}
            {showCloseButton && (
              <RadixDialog.Close asChild onClick={onClose}>
                <IconButton
                  icon="i-ph:x"
                  className="absolute top-4 right-4 text-smack-elements-textTertiary hover:text-smack-elements-textSecondary hover:bg-smack-elements-background-depth-3 transition-all"
                />
              </RadixDialog.Close>
            )}
          </div>
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked
   */
  onConfirm: () => void;

  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The description of the dialog
   */
  description: string;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The text for the cancel button
   */
  cancelLabel?: string;

  /**
   * The variant of the confirm button
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Whether the confirm button is in a loading state
   */
  isLoading?: boolean;
}

/**
 * A reusable confirmation dialog component that uses the Dialog component
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false}>
        <div className="p-8 bg-smack-elements-background-depth-2 relative z-10">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="mt-3 mb-6 text-base leading-relaxed">{description}</DialogDescription>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
              className={function() {
                if (variant === 'destructive') {
                  return 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5';
                }
                return 'bg-accent text-white hover:bg-accent-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5';
              }()}
            >
              {isLoading ? (
                <>
                  <div className="i-ph-spinner-gap-bold animate-spin w-4 h-4 mr-2" />
                  {confirmLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}

/**
 * Type for selection item in SelectionDialog
 */
type SelectionItem = {
  id: string;
  label: string;
  description?: string;
};

/**
 * Props for the SelectionDialog component
 */
export interface SelectionDialogProps {
  /**
   * The title of the dialog
   */
  title: string;

  /**
   * The items to select from
   */
  items: SelectionItem[];

  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;

  /**
   * Callback when the confirm button is clicked with selected item IDs
   */
  onConfirm: (selectedIds: string[]) => void;

  /**
   * The text for the confirm button
   */
  confirmLabel?: string;

  /**
   * The maximum height of the selection list
   */
  maxHeight?: string;
}

/**
 * A reusable selection dialog component that uses the Dialog component
 */
export function SelectionDialog({
  title,
  items,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  maxHeight = '60vh',
}: SelectionDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selected items when dialog opens
  useEffect(function() {
    if (isOpen) {
      setSelectedItems([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  const handleToggleItem = function(id: string) {
    setSelectedItems(function(prev) {
      if (prev.includes(id)) {
        return prev.filter(function(itemId) { return itemId !== id });
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = function() {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(items.map(function(item) { return item.id }));
      setSelectAll(true);
    }
  };

  const handleConfirm = function() {
    onConfirm(selectedItems);
    onClose();
  };

  // Calculate the height for the virtualized list
  const listHeight = Math.min(
    items.length * 60,
    parseInt(maxHeight.replace('vh', '')) * window.innerHeight * 0.01 - 40,
  );

  // Render each item in the virtualized list
  const ItemRenderer = function({ index, style }: { index: number; style: React.CSSProperties }) {
    const item = items[index];
    return (
      <div
        key={item.id}
        className={classNames(
          'flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer',
          selectedItems.includes(item.id)
            ? 'bg-accent/10 border border-accent/30'
            : 'bg-smack-elements-bg-depth-2 hover:bg-smack-elements-item-backgroundActive border border-transparent hover:border-smack-elements-borderColor/50',
        )}
        style={{
          ...style,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Checkbox
          id={`item-${item.id}`}
          checked={selectedItems.includes(item.id)}
          onCheckedChange={function() { return handleToggleItem(item.id) }}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor={`item-${item.id}`}
            className={classNames(
              'text-sm font-medium cursor-pointer',
              selectedItems.includes(item.id)
                ? 'text-accent'
                : 'text-smack-elements-textPrimary',
            )}
          >
            {item.label}
          </Label>
          {item.description && <p className="text-xs text-smack-elements-textSecondary">{item.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog showCloseButton={false}>
        <div className="p-8 bg-smack-elements-background-depth-2 relative z-10">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="mt-3 mb-5">
            Select the items you want to include and click{' '}
            <span className="text-accent font-semibold">{confirmLabel}</span>.
          </DialogDescription>

          <div className="py-4">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-smack-elements-textSecondary">
                {selectedItems.length} of {items.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-sm h-9 px-4 text-smack-elements-textPrimary hover:text-accent hover:bg-accent/10"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div
              className="pr-3 border rounded-xl border-smack-elements-borderColor bg-smack-elements-bg-depth-1"
              style={{
                maxHeight,
              }}
            >
              {items.length > 0 ? (
                <FixedSizeList
                  height={listHeight}
                  width="100%"
                  itemCount={items.length}
                  itemSize={70}
                  className="scrollbar-thin scrollbar-thumb-rounded-lg"
                >
                  {ItemRenderer}
                </FixedSizeList>
              ) : (
                <div className="text-center py-8 text-sm text-smack-elements-textTertiary">No items to display</div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-smack-elements-borderColor/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="px-6 py-3 bg-accent text-white hover:bg-accent-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
