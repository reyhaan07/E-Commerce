import { configureStore } from '@reduxjs/toolkit'

const rootReducer = (state = {}) => state

const store = configureStore({
  reducer: rootReducer,
})

export default store
