import { WebSocketProvider } from 'src/providers/websocket'
import { ROUTE_NODES } from 'src/routes'
import 'src/styles/global.css'
import { Toaster } from 'react-hot-toast'
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import NodesPage from './nodes'
import NodeDetailsPage from './nodes/[nodeId]'
import NodeContainerLogPage from './nodes/[nodeId]/log'
import StatusPage from './status'
import Page404 from './404'
import Page500 from './500'
import { MainLayout } from 'src/components/layout'
import LoginPage from './login'
import React from 'react'
import { AuthOnlyRoute, AuthWrapper, ProtectedRoute } from 'src/components/auth'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<Page500 />}>
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to={ROUTE_NODES} />
            </ProtectedRoute>
          }
        />
        <Route
          path="nodes"
          element={
            <ProtectedRoute>
              <NodesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="nodes/:nodeId"
          element={
            <ProtectedRoute>
              <NodeDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="nodes/:nodeId/log"
          element={
            <ProtectedRoute>
              <NodeContainerLogPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="status" element={<StatusPage />} />
      <Route
        path="login"
        element={
          <AuthOnlyRoute>
            <LoginPage />
          </AuthOnlyRoute>
        }
      />
      <Route path="*" element={<Page404 />} />
    </Route>,
  ),
)

const LensApp = () => (
  <WebSocketProvider>
    <Toaster
      toastOptions={{
        error: {
          icon: null,
          className: '!bg-lens-error-red',
          style: {
            color: 'white',
          },
          position: 'top-center',
        },
      }}
    />

    <AuthWrapper>
      <RouterProvider router={router} />
    </AuthWrapper>
  </WebSocketProvider>
)

export default LensApp
