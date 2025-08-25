'use client';

import { constants } from '../constants';

interface ContactFormLinkProps {
  onOpenForm: () => void;
}

export default function ContactFormLink({ onOpenForm }: ContactFormLinkProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-teal-800 dark:text-teal-200">
              📋 Formulário de Contato
            </h3>
            <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
              Para continuar com o processo e criar seu acesso personalizado à Sala Segura, clique no botão abaixo.
            </p>
            <button
              onClick={onOpenForm}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 dark:text-teal-200 dark:bg-teal-800 dark:hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
            >
              Abrir Formulário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
