import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense, lazy } from 'react'
import Navbar from '@/components/layout/Navbar'
import PageWrapper from '@/components/layout/PageWrapper'

// Lazy-loaded pages
const HomePage    = lazy(() => import('@/pages/HomePage'))
const GamePage    = lazy(() => import('@/pages/GamePage'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageWrapper>
                <HomePage />
              </PageWrapper>
            } />
            <Route path="/game/:gameId" element={
              <PageWrapper>
                <GamePage />
              </PageWrapper>
            } />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}
