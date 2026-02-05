import { createContext } from 'react';
import type { User } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  updateBankroll: (newBankroll: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
  updateBankroll: async () => {},
});
