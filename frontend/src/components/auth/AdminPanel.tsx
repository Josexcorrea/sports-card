import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import type { User } from '../../types';

interface PendingUser extends User {
  id: string;
}

export function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      if (!db) {
        setPendingUsers([]);
        return;
      }
      const q = query(collection(db, 'users'), where('approved', '==', false));
      const snapshot = await getDocs(q);
      
      const users: PendingUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        bankroll: doc.data().bankroll,
        approved: doc.data().approved,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchUsers = async () => {
      if (!mounted) return;
      await loadPendingUsers();
    };
    
    fetchUsers();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      if (!db) {
        return;
      }
      await updateDoc(doc(db, 'users', userId), {
        approved: true,
      });
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleDeny = async (userId: string) => {
    try {
      // In production, you might want to delete the user or mark as denied
      // For now, just remove from list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error denying user:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isFirebaseConfigured || !db) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <h2 className="text-xl font-semibold text-white mb-3">Firebase not configured</h2>
          <p className="text-gray-300 text-sm">
            Create <strong>.env</strong> from <strong>.env.example</strong> and fill in Firebase values.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel - Pending Access Requests</h1>

        {pendingUsers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <p className="text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold text-lg">{user.email}</p>
                  <p className="text-gray-400 text-sm">
                    Requested: {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(user.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(user.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
