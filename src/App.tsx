import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonPage } from './pages/LessonPage';
import { StylePage } from './pages/StylePage';

// three.js is most of the bundle, so the Lab loads only when it is opened.
const LabPage = lazy(() => import('./pages/LabPage').then((m) => ({ default: m.LabPage })));

export function App() {
  return (
    <Routes>
      {/* The Lab is full-bleed, so it sits outside the reading shell. */}
      <Route
        path="/lab"
        element={
          <Suspense fallback={<LabLoading />}>
            <LabPage />
          </Suspense>
        }
      />
      <Route element={<Shell />} path="/">
        <Route index element={<HomePage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lesson/:slug" element={<LessonPage />} />
        <Route path="style" element={<StylePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function LabLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <p className="font-mono text-[13px] text-ink-3">loading the bench…</p>
    </div>
  );
}
