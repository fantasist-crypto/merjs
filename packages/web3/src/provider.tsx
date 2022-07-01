import { createContext, type ReactNode } from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Web3Context {}

const { Provider } = createContext<Web3Context | undefined>(undefined)

export interface Web3ProviderProps {
  children?: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return <Provider value={{}}>{children}</Provider>
}

export function useWeb3() {
  return {}
}
