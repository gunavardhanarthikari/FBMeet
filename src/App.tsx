import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppRoutes } from '@/routes/AppRoutes'
import { MeetingProvider } from '@/contexts'

function App() {
  return (
    <ErrorBoundary>
      <MeetingProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </MeetingProvider>
    </ErrorBoundary>
  )
}

export default App
