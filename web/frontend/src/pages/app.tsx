import { WebSocketProvider } from 'src/providers/websocket'
import { ROUTE_NODES } from 'src/routes'
import 'src/styles/global.css'
import { Toaster } from 'react-hot-toast'
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom'
import NodesPage from './nodes'
import NodeDetailsPage from './nodes/[nodeId]'
import NodeContainerLogPage from './nodes/[nodeId]/log'
import StatusPage from './status'
import Page404 from './404'
import Page500 from './500'
import { MainLayout } from 'src/components/layout'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<Page500 />}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to={ROUTE_NODES} />} />
        <Route path="nodes" element={<NodesPage />} />
        <Route path="nodes/:nodeId" element={<NodeDetailsPage />} />
        <Route path="nodes/:nodeId/log" element={<NodeContainerLogPage />} />
        <Route path="status" element={<StatusPage />} />
      </Route>

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

    <RouterProvider router={router} />
  </WebSocketProvider>
)

export default LensApp
