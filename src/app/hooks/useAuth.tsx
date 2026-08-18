import { useContext } from 'react'
import { Context as AuthContext } from 'app/contexts/AuthContext'

const useAuth = () => {
  return useContext(AuthContext)
}

export default useAuth
