'use client'

import React, { createContext, useContext, useState } from 'react'

export type SortColumn = 'name' | 'sport' | 'status' | 'date' | 'created' | 'type'
export type SortOrder = 'asc' | 'desc'
export type TableType = 'leagues' | 'drafts-templates' | 'drafts' | 'templates'

interface TableState {
  searchQuery: string
  filterValue: string
  sortBy: SortColumn
  sortOrder: SortOrder
}

interface OrganizerTableContextType {
  tableStates: Record<TableType, TableState>
  setSearchQuery: (tableType: TableType, query: string) => void
  setFilterValue: (tableType: TableType, filter: string) => void
  setSortBy: (tableType: TableType, column: SortColumn) => void
  setSortOrder: (tableType: TableType, order: SortOrder) => void
  toggleSort: (tableType: TableType, column: SortColumn) => void
  resetTableState: (tableType: TableType) => void
}

const OrganizerTableContext = createContext<OrganizerTableContextType | undefined>(undefined)

const defaultTableState: TableState = {
  searchQuery: '',
  filterValue: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
}

export function OrganizerTableProvider({ children }: { children: React.ReactNode }) {
  const [tableStates, setTableStates] = useState<Record<TableType, TableState>>({
    'leagues': { ...defaultTableState, sortBy: 'date' },
    'drafts-templates': { ...defaultTableState, sortBy: 'created', sortOrder: 'desc' },
    'drafts': { ...defaultTableState, sortBy: 'created', sortOrder: 'desc' },
    'templates': { ...defaultTableState, sortBy: 'created', sortOrder: 'desc' },
  })

  const setSearchQuery = (tableType: TableType, query: string) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], searchQuery: query },
    }))
  }

  const setFilterValue = (tableType: TableType, filter: string) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], filterValue: filter },
    }))
  }

  const setSortBy = (tableType: TableType, column: SortColumn) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], sortBy: column },
    }))
  }

  const setSortOrder = (tableType: TableType, order: SortOrder) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], sortOrder: order },
    }))
  }

  const toggleSort = (tableType: TableType, column: SortColumn) => {
    setTableStates(prev => {
      const current = prev[tableType]
      const newOrder = current.sortBy === column && current.sortOrder === 'asc' ? 'desc' : 'asc'
      return {
        ...prev,
        [tableType]: { ...current, sortBy: column, sortOrder: newOrder },
      }
    })
  }

  const resetTableState = (tableType: TableType) => {
    const defaultSortBy: Record<TableType, SortColumn> = {
      'leagues': 'date',
      'drafts-templates': 'created',
      'drafts': 'created',
      'templates': 'created',
    }
    setTableStates(prev => ({
      ...prev,
      [tableType]: {
        searchQuery: '',
        filterValue: 'all',
        sortBy: defaultSortBy[tableType],
        sortOrder: 'desc',
      },
    }))
  }

  return (
    <OrganizerTableContext.Provider value={{
      tableStates,
      setSearchQuery,
      setFilterValue,
      setSortBy,
      setSortOrder,
      toggleSort,
      resetTableState,
    }}>
      {children}
    </OrganizerTableContext.Provider>
  )
}

export function useOrganizerTable(tableType: TableType) {
  const context = useContext(OrganizerTableContext)
  if (!context) {
    throw new Error('useOrganizerTable must be used within OrganizerTableProvider')
  }

  return {
    state: context.tableStates[tableType],
    setSearchQuery: (query: string) => context.setSearchQuery(tableType, query),
    setFilterValue: (filter: string) => context.setFilterValue(tableType, filter),
    setSortBy: (column: SortColumn) => context.setSortBy(tableType, column),
    setSortOrder: (order: SortOrder) => context.setSortOrder(tableType, order),
    toggleSort: (column: SortColumn) => context.toggleSort(tableType, column),
    resetTableState: () => context.resetTableState(tableType),
  }
}
