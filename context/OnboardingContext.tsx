import React, { createContext, useContext, useState } from 'react';

// Define the shape of our data for type safety
interface OnboardingData {
  userType: 'student' | 'employee' | null;
  income: number;
  obligations: { [key: string]: number };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    userType: null,
    income: 0,
    obligations: {},
  });

  // Helper to merge new data into the existing state
  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => setData({ userType: null, income: 0, obligations: {} });

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook to make using the context easier in your screens
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};