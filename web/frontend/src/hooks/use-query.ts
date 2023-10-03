import React from 'react'
import { useLocation } from 'react-router-dom'

const useQuery = <TQuery>(): TQuery => {
  const { search } = useLocation()

  return React.useMemo(() => Object.fromEntries(new URLSearchParams(search)) as TQuery, [search])
}

export default useQuery
