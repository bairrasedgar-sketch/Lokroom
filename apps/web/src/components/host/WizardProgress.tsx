"use client";

import { Check } from "lucide-react";

interface WizardStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface WizardProgressProps {
  steps: WizardStep[];
}

export default function WizardProgress({ steps }: WizardProgressProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className="relative flex items-center justify-center">
                    {step.completed ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    ) : step.current ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                        <span className="text-sm font-semibold text-blue-600">{stepIdx + 1}</span>
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                        <span className="text-sm font-semibold text-gray-400">{stepIdx + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {stepIdx !== steps.length - 1 && (
                    <div className="ml-4 flex-1 hidden sm:block">
                      <div className={`h-0.5 ${step.completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
