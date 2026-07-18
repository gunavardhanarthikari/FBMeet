import { AppLayout } from '@/components/layout/AppLayout'
import { AppRoutes } from '@/routes/AppRoutes'
import { MeetingProvider } from '@/contexts'

function App() {
  return (
    <MeetingProvider>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </MeetingProvider>
  )
}

export default App
