import { HashRouter, Routes, Route } from "react-router-dom";
import VetDashboard from "./pages/VetDashboard";

const App = () => (
    <HashRouter>
        <Routes>
            <Route path="/" element={<VetDashboard />} />
        </Routes>
    </HashRouter>
);

export default App;
