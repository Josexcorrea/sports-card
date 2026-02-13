import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { auth, db } from '../../lib/firebase';

export function Header() {
  // Get the current logged-in user from our auth context
  const { currentUser, updateBankroll } = useAuth();
  const navigate = useNavigate();
  
  // State to track if we're editing the bankroll
  const [isEditingBankroll, setIsEditingBankroll] = useState(false);
  // Store the input value while user is typing
  const [bankrollInput, setBankrollInput] = useState('');

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);  // Sign out from Firebase
      navigate('/login');    // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function to save the new bankroll amount
  const handleBankrollSave = async () => {
    if (!currentUser) return; // Safety check - make sure user exists
    
    const newBankroll = parseFloat(bankrollInput); // Convert text to number
    
    // Check if it's a valid number
    if (isNaN(newBankroll) || newBankroll < 0) {
      alert('Please enter a valid bankroll amount');
      return;
    }

    try {
      // Update bankroll in Firestore database
      await updateDoc(doc(db, 'users', currentUser.uid), {
        bankroll: newBankroll
      });
      
      // Update local state through our auth context
      await updateBankroll(newBankroll);
      
      // Exit edit mode
      setIsEditingBankroll(false);
    } catch (error) {
      console.error('Error updating bankroll:', error);
      alert('Failed to update bankroll');
    }
  };

  // TODO: Add JSX/HTML for the header UI

  // If no user is logged in, don't show anything
  if (!currentUser) return null;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      {/* Container for the entire header - flex makes items sit side by side */}
      <div className="flex items-center justify-between">
        
        {/* LEFT SIDE: Username and Bankroll */}
        <div className="flex items-center gap-4">
          {/* Username */}
          <span className="text-white font-medium">
            {currentUser.displayName}
          </span>
          
          {/* Separator | */}
          <span className="text-gray-500">|</span>
          
          {/* Bankroll - either display or edit mode */}
          {isEditingBankroll ? (
            // EDIT MODE: Show input field and save button
            <div className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                value={bankrollInput}
                onChange={(e) => setBankrollInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBankrollSave();
                  if (e.key === 'Escape') setIsEditingBankroll(false);
                }}
                autoFocus
                className="w-32 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleBankrollSave}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingBankroll(false)}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            // DISPLAY MODE: Show bankroll, clickable to edit
            <button
              onClick={() => {
                setBankrollInput(currentUser.bankroll.toString());
                setIsEditingBankroll(true);
              }}
              className="text-green-400 font-semibold hover:text-green-300 transition-colors"
            >
              ${currentUser.bankroll.toLocaleString()}
            </button>
          )}
        </div>

        {/* RIGHT SIDE: Logout button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
