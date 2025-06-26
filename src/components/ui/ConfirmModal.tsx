'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sil',
  cancelText = 'İptal',
  type = 'danger',
  loading = false
}: ConfirmModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-lg px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-red-100">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-lg bg-white/80 text-gray-400 hover:text-gray-500 hover:bg-white/90 p-2 transition-all duration-200"
                    onClick={onClose}
                  >
                    <span className="sr-only">Kapat</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {type === 'danger' ? (
                      <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 sm:w-auto ${
                      type === 'danger'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İşleniyor...
                      </>
                    ) : (
                      confirmText
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-white/90 transition-all duration-200 sm:mt-0 sm:w-auto transform hover:scale-105"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 