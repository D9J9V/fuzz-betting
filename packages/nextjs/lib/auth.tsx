import { type ReactNode, createContext, useContext, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Database } from "~~/types/database.types";

type User = {
  address: string;
} | null;

interface AuthContextType {
  signIn: () => Promise<any>; // Changed return type to Promise<any> to match implementation
  signOut: () => Promise<void>;
  user: User;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  user: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  const signIn = async () => {
    try {
      if (!window.ethereum) throw new Error("No wallet found");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No account selected");
      }

      const address = accounts[0].toLowerCase();
      const nonce = Math.random().toString(36).substring(7);
      const message = `Sign in to FuzzBetting\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      console.log("Attempting to upsert user with address:", address);

      const { error } = await supabase.from("users").upsert(
        {
          address: address,
          last_signin: new Date().toISOString(),
          signature: signature,
        },
        { onConflict: "address" },
      );

      if (error) throw error;

      setUser({ address });
      return { address }; // Return consistent user object
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
  };

  return <AuthContext.Provider value={{ signIn, signOut, user }}>{children}</AuthContext.Provider>;
};
