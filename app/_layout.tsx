import { Slot } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotesProvider>
          <Slot />
        </NotesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}