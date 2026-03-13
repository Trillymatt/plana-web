import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConsumerLanding from './pages/ConsumerLanding';
import CreatorLanding from './pages/CreatorLanding';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConsumerLanding />} />
        <Route path="/creators" element={<CreatorLanding />} />
      </Routes>
    </BrowserRouter>
  );
}
