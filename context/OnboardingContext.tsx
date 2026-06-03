// import React, { createContext, useContext, useState } from 'react';
// interface OnboardingData {
//   userType: 'student' | 'employee' | null;
//   income: number;
//   obligations: { [key: string]: number };
// }

// interface OnboardingContextType {
//   data: OnboardingData;
//   updateData: (updates: Partial<OnboardingData>) => void;
//   resetData: () => void;
// }

// const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// export function OnboardingProvider({ children }: { children: React.ReactNode }) {
//   const [data, setData] = useState<OnboardingData>({
//     userType: null,
//     income: 0,
//     obligations: {},
//   });

//   const updateData = (updates: Partial<OnboardingData>) => {
//     setData((prev) => ({ ...prev, ...updates }));
//   };

//   const resetData = () => setData({ userType: null, income: 0, obligations: {} });

//   return (
//     <OnboardingContext.Provider value={{ data, updateData, resetData }}>
//       {children}
//     </OnboardingContext.Provider>
//   );
// }
// export const useOnboarding = () => {
//   const context = useContext(OnboardingContext);
//   if (!context) {
//     throw new Error("useOnboarding must be used within an OnboardingProvider");
//   }
//   return context;
// };
import React, { createContext, useContext, useState } from 'react';

interface OnboardingData {
  userType: 'student' | 'employee' | null;
  income: number;
  spentThisMonth: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  userType: null,
  income: 0,
  spentThisMonth: 0,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => setData(defaultData);

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};