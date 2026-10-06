import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UserAnalysis } from './pages/UserAnalysis';
import { RelationshipAnalysis } from './pages/RelationshipAnalysis';
import { TemporalAnalysis } from './pages/TemporalAnalysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="user-analysis" element={<UserAnalysis />} />
          <Route path="relationship" element={<RelationshipAnalysis />} />
          <Route path="temporal" element={<TemporalAnalysis />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
