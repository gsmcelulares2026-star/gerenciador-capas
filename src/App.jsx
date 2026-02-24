import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Importar from './pages/Importar';
import Estoque from './pages/Estoque';
import Relatorios from './pages/Relatorios';
import { populateSampleData } from './db/db';

export default function App() {
  useEffect(() => {
    populateSampleData().then(count => {
      if (count) console.log(`Banco populado com ${count} registros de exemplo.`);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/importar" element={<Importar />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
