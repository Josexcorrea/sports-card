import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDefinition';

export const useAuth = () => useContext(AuthContext);
