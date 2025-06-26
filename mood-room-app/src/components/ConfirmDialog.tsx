'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';

type ConfirmDialogProps = {
  title?: string;// title of the pop up/ modal/ dialog
  body: string;// description/ body of the dialog
  confirmText?: string;// the text of the button to confirm/ accept the pop up
  confirmColour?: string;// the colour of the button to confirm/ accept the pop up
  cancelText?: string;// text of the button to close the pop up
  cancelColour?: string;// colour of the button to close the pop up
  onConfirm: () => void;// function to run once user accepts model
  onCancel?: () => void;// function to fun when user closes pop up
  open: boolean;// if the dialog is open or not
  onOpenChange: (open: boolean) => void;// what to do when it opens
};

export function ConfirmDialog({
  title = 'Are you sure?',
  body,
  confirmText = 'Confirm',
  confirmColour = 'bg-green-600 text-white',
  cancelText = 'Cancel',
  cancelColour = 'bg-gray-200 text-gray-900',
  onConfirm,
  onCancel,
  open,
  onOpenChange,
}: ConfirmDialogProps) {

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Background overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black z-998"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            {/* Dialog content box */}
            <Dialog.Content asChild className='flex flex-col justify-center items-center gap-4'>
              <motion.div
                className="fixed top-1/2 left-1/2 z-999 w-[80vw] max-w-md max-h-[70vh] translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-lg shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Dialog.Title  className="text-lg font-semibold">{title}</Dialog.Title>

                <Dialog.Description className="text-gray-700">{body}</Dialog.Description>

                {/* button container */}
                <div className="flex justify-end gap-3">
                  <Dialog.Close asChild>
                      <button
                      onClick={onCancel}
                      className={`px-4 py-2 text-sm rounded ${cancelColour}`}
                      >
                      {cancelText}
                      </button>
                  </Dialog.Close>

                  <Dialog.Close asChild>
                      <button
                      onClick={onConfirm}
                      className={`px-4 py-2 text-sm rounded ${confirmColour}`}
                      >
                      {confirmText}
                      </button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
