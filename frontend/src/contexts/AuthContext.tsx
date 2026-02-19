import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import type { User } from '../types';
import { AuthContext } from './AuthContextDefinition';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setCurrentUser({
        uid: 'mock-user',
        email: 'mock@example.com',
        displayName: 'Mock User',
        bankroll: 1000,
        approved: true,
        createdAt: new Date(),
      });
      setFirebaseUser(null);
      setLoading(false);
      return;
    }

    const authInstance = auth;
    const dbInstance = db;
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        setFirebaseUser(user);

        if (user) {
          try {
            const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCurrentUser({
                uid: user.uid,
                email: user.email || '',
                displayName: userData.displayName || user.email?.split('@')[0] || 'User',
                bankroll: userData.bankroll || 0,
                approved: userData.approved || false,
                createdAt: userData.createdAt?.toDate() || new Date(),
              });
            } else {
              setCurrentUser(null);
            }
          } catch (error) {
            console.error('Error loading user document:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        setLoading(false);
      });
    } catch (error) {
      console.error('Error initializing Firebase auth listener:', error);
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const updateBankroll = async (newBankroll: number) => {
    // Will implement Firestore update in next phase
    if (currentUser) {
      setCurrentUser({ ...currentUser, bankroll: newBankroll });
    }
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    updateBankroll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
