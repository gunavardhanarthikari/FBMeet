import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home/Home'
import { Room } from '@/pages/Room/Room'
import { Left } from '@/pages/Left/Left'
import { ShareConfirm } from '@/pages/ShareConfirm/ShareConfirm'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="/left" element={<Left />} />
      <Route path="/share-screen" element={<ShareConfirm />} />
    </Routes>
  )
}
