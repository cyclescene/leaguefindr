'use client'

import React, { createContext, useContext, useState } from 'react'

export type AdminSortColumn = 'name' | 'created_at' | 'dateSubmitted' | 'startDate' | 'org_name' | 'sport' | 'gender' | 'venue' | 'organizationName' | 'date'
export type SortOrder = 'asc' | 'desc'
export type AdminTableType = 'leagues' | 'organizations' | 'sports' | 'venues' | 'drafts'

interface TableState {
  searchQuery: string
  filterValue: string
  filterTypeValue: string
  sortBy: AdminSortColumn
  sortOrder: SortOrder
  page: number
}

interface AdminTableContextType {
  tableStates: Record<AdminTableType, TableState>
  setSearchQuery: (tableType: AdminTableType, query: string) => void
  setFilterValue: (tableType: AdminTableType, filter: string) => void
  setFilterTypeValue: (tableType: AdminTableType, filter: string) => void
  setSortBy: (tableType: AdminTableType, column: AdminSortColumn) => void
  setSortOrder: (tableType: AdminTableType, order: SortOrder) => void
  toggleSort: (tableType: AdminTableType, column: AdminSortColumn) => void
  setPage: (tableType: AdminTableType, page: number) => void
  resetTableState: (tableType: AdminTableType) => void
}

const AdminTableContext = createContext<AdminTableContextType | undefined>(undefined)

const defaultTableState: TableState = {
  searchQuery: '',
  filterValue: '',
  filterTypeValue: '',
  sortBy: 'dateSubmitted',
  sortOrder: 'desc',
  page: 0,
}

const defaultSortBy: Record<AdminTableType, AdminSortColumn> = {
  'leagues': 'dateSubmitted',
  'organizations': 'org_name',
  'sports': 'name',
  'venues': 'name',
  'drafts': 'created_at',
}

export function AdminTableProvider({ children }: { children: React.ReactNode }) {
  const [tableStates, setTableStates] = useState<Record<AdminTableType, TableState>>(
    {
      'leagues': { ...defaultTableState, sortBy: 'dateSubmitted', sortOrder: 'desc' },
      'organizations': { ...defaultTableState, sortBy: 'org_name', sortOrder: 'asc' },
      'sports': { ...defaultTableState, sortBy: 'name', sortOrder: 'asc' },
      'venues': { ...defaultTableState, sortBy: 'name', sortOrder: 'asc' },
      'drafts': { ...defaultTableState, sortBy: 'created_at', sortOrder: 'desc' },
    }
  )

  const setSearchQuery = (tableType: AdminTableType, query: string) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], searchQuery: query, page: 0 },
    }))
  }

  const setFilterValue = (tableType: AdminTableType, filter: string) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], filterValue: filter, page: 0 },
    }))
  }

  const setFilterTypeValue = (tableType: AdminTableType, filter: string) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], filterTypeValue: filter, page: 0 },
    }))
  }

  const setSortBy = (tableType: AdminTableType, column: AdminSortColumn) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], sortBy: column },
    }))
  }

  const setSortOrder = (tableType: AdminTableType, order: SortOrder) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], sortOrder: order },
    }))
  }

  const toggleSort = (tableType: AdminTableType, column: AdminSortColumn) => {
    setTableStates(prev => {
      const current = prev[tableType]
      const newOrder = current.sortBy === column && current.sortOrder === 'asc' ? 'desc' : 'asc'
      return {
        ...prev,
        [tableType]: { ...current, sortBy: column, sortOrder: newOrder },
      }
    })
  }

  const setPage = (tableType: AdminTableType, page: number) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: { ...prev[tableType], page },
    }))
  }

  const resetTableState = (tableType: AdminTableType) => {
    setTableStates(prev => ({
      ...prev,
      [tableType]: {
        searchQuery: '',
        filterValue: '',
        filterTypeValue: '',
        sortBy: defaultSortBy[tableType],
        sortOrder: 'desc',
        page: 0,
      },
    }))
  }

  return (
    <AdminTableContext.Provider value={{
      tableStates,
      setSearchQuery,
      setFilterValue,
      setFilterTypeValue,
      setSortBy,
      setSortOrder,
      toggleSort,
      setPage,
      resetTableState,
    }}>
      {children}
    </AdminTableContext.Provider>
  )
}

export function useAdminTable(tableType: AdminTableType) {
  const context = useContext(AdminTableContext)
  if (!context) {
    throw new Error('useAdminTable must be used within AdminTableProvider')
  }

  return {
    state: context.tableStates[tableType],
    setSearchQuery: (query: string) => context.setSearchQuery(tableType, query),
    setFilterValue: (filter: string) => context.setFilterValue(tableType, filter),
    setFilterTypeValue: (filter: string) => context.setFilterTypeValue(tableType, filter),
    setSortBy: (column: AdminSortColumn) => context.setSortBy(tableType, column),
    setSortOrder: (order: SortOrder) => context.setSortOrder(tableType, order),
    toggleSort: (column: AdminSortColumn) => context.toggleSort(tableType, column),
    setPage: (page: number) => context.setPage(tableType, page),
    resetTableState: () => context.resetTableState(tableType),
  }
}
