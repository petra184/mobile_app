"use client"

import type React from "react"
import { createContext, useContext, type ReactNode } from "react"
import { useCompleteDataStore } from "./dataStore"
import { useRealtimeNotifications } from "./notifications"
import type { CompleteDataStore, DataStoreActions } from "../../types/database"

interface CompleteDataContextType extends CompleteDataStore, DataStoreActions {
  sendPushNotification: (title: string, body: string, data?: any) => Promise<void>
  isConnected: boolean
  connectionStatus: Record<string, boolean>
}

const CompleteDataContext = createContext<CompleteDataContextType | undefined>(undefined)

interface CompleteDataProviderProps {
  children: ReactNode
  currentUserId?: string
}

export const CompleteDataProvider: React.FC<CompleteDataProviderProps> = ({ children, currentUserId }) => {
  const dataStore = useCompleteDataStore(currentUserId)
  const { sendPushNotification, isConnected, connectionStatus } = useRealtimeNotifications(currentUserId)

  const contextValue: CompleteDataContextType = {
    ...dataStore,
    sendPushNotification,
    isConnected,
    connectionStatus,
  }

  return <CompleteDataContext.Provider value={contextValue}>{children}</CompleteDataContext.Provider>
}

export const useCompleteData = (): CompleteDataContextType => {
  const context = useContext(CompleteDataContext)
  if (context === undefined) {
    throw new Error("useCompleteData must be used within a CompleteDataProvider")
  }
  return context
}
