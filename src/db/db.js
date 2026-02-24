import Dexie from 'dexie';

export const db = new Dexie('CapasDatabase');

db.version(1).stores({
  capas: '++id, modelo, marca, tipo, cor, preco, quantidade, fornecedor, dataEntrada, observacoes',
  importacoes: '++id, nomeArquivo, dataImportacao, totalRegistros'
});

// === CAPAS CRUD ===

export async function addCapa(capa) {
  return await db.capas.add({
    ...capa,
    dataEntrada: capa.dataEntrada || new Date().toISOString().split('T')[0]
  });
}

export async function addCapasBulk(capas) {
  const items = capas.map(c => ({
    ...c,
    dataEntrada: c.dataEntrada || new Date().toISOString().split('T')[0]
  }));
  return await db.capas.bulkAdd(items);
}

export async function getAllCapas() {
  return await db.capas.toArray();
}

export async function getCapa(id) {
  return await db.capas.get(id);
}

export async function updateCapa(id, changes) {
  return await db.capas.update(id, changes);
}

export async function deleteCapa(id) {
  return await db.capas.delete(id);
}

export async function deleteAllCapas() {
  return await db.capas.clear();
}

export async function searchCapas(query) {
  const lower = query.toLowerCase();
  const all = await db.capas.toArray();
  return all.filter(c =>
    (c.modelo || '').toLowerCase().includes(lower) ||
    (c.marca || '').toLowerCase().includes(lower) ||
    (c.cor || '').toLowerCase().includes(lower) ||
    (c.tipo || '').toLowerCase().includes(lower) ||
    (c.fornecedor || '').toLowerCase().includes(lower)
  );
}

// === IMPORTAÇÕES ===

export async function addImportacao(importacao) {
  return await db.importacoes.add({
    ...importacao,
    dataImportacao: new Date().toISOString()
  });
}

export async function getAllImportacoes() {
  return await db.importacoes.reverse().sortBy('dataImportacao');
}

// === ESTATÍSTICAS ===

export async function getStats() {
  const capas = await db.capas.toArray();
  const totalModelos = capas.length;
  const totalUnidades = capas.reduce((sum, c) => sum + (Number(c.quantidade) || 0), 0);
  const valorTotal = capas.reduce((sum, c) => sum + ((Number(c.preco) || 0) * (Number(c.quantidade) || 0)), 0);

  // Por marca
  const porMarca = {};
  capas.forEach(c => {
    const marca = c.marca || 'Sem marca';
    if (!porMarca[marca]) porMarca[marca] = { quantidade: 0, valor: 0 };
    porMarca[marca].quantidade += Number(c.quantidade) || 0;
    porMarca[marca].valor += (Number(c.preco) || 0) * (Number(c.quantidade) || 0);
  });

  // Por tipo
  const porTipo = {};
  capas.forEach(c => {
    const tipo = c.tipo || 'Sem tipo';
    if (!porTipo[tipo]) porTipo[tipo] = { quantidade: 0, valor: 0 };
    porTipo[tipo].quantidade += Number(c.quantidade) || 0;
    porTipo[tipo].valor += (Number(c.preco) || 0) * (Number(c.quantidade) || 0);
  });

  // Por cor
  const porCor = {};
  capas.forEach(c => {
    const cor = c.cor || 'Sem cor';
    if (!porCor[cor]) porCor[cor] = { quantidade: 0 };
    porCor[cor].quantidade += Number(c.quantidade) || 0;
  });

  // Top modelos
  const topModelos = [...capas]
    .sort((a, b) => (Number(b.quantidade) || 0) - (Number(a.quantidade) || 0))
    .slice(0, 10);

  return {
    totalModelos,
    totalUnidades,
    valorTotal,
    porMarca,
    porTipo,
    porCor,
    topModelos
  };
}

// === RELATÓRIO DE ESTOQUE ===

export async function getEstoqueReport({ filtroTipo = '', filtroCor = '', qtdMinima = 5 } = {}) {
  const capas = await db.capas.toArray();

  const filtered = capas.filter(c => {
    const matchTipo = !filtroTipo || (c.tipo || '').toLowerCase() === filtroTipo.toLowerCase();
    const matchCor = !filtroCor || (c.cor || '').toLowerCase() === filtroCor.toLowerCase();
    return matchTipo && matchCor;
  });

  const zerados = filtered.filter(c => (Number(c.quantidade) || 0) === 0);
  const abaixoMinimo = filtered.filter(c => {
    const qty = Number(c.quantidade) || 0;
    return qty > 0 && qty <= qtdMinima;
  });
  const comEstoque = filtered.filter(c => (Number(c.quantidade) || 0) > qtdMinima);

  // Resumo por tipo
  const resumoPorTipo = {};
  filtered.forEach(c => {
    const tipo = c.tipo || 'Sem tipo';
    if (!resumoPorTipo[tipo]) resumoPorTipo[tipo] = { total: 0, zerados: 0, abaixoMinimo: 0 };
    resumoPorTipo[tipo].total++;
    const qty = Number(c.quantidade) || 0;
    if (qty === 0) resumoPorTipo[tipo].zerados++;
    else if (qty <= qtdMinima) resumoPorTipo[tipo].abaixoMinimo++;
  });

  // Resumo por cor
  const resumoPorCor = {};
  filtered.forEach(c => {
    const cor = c.cor || 'Sem cor';
    if (!resumoPorCor[cor]) resumoPorCor[cor] = { total: 0, zerados: 0, abaixoMinimo: 0 };
    resumoPorCor[cor].total++;
    const qty = Number(c.quantidade) || 0;
    if (qty === 0) resumoPorCor[cor].zerados++;
    else if (qty <= qtdMinima) resumoPorCor[cor].abaixoMinimo++;
  });

  // Listas únicas para filtros
  const tiposUnicos = [...new Set(capas.map(c => c.tipo).filter(Boolean))].sort();
  const coresUnicas = [...new Set(capas.map(c => c.cor).filter(Boolean))].sort();

  return {
    zerados,
    abaixoMinimo,
    comEstoque,
    resumoPorTipo,
    resumoPorCor,
    tiposUnicos,
    coresUnicas,
    totalFiltrado: filtered.length,
  };
}

// === DADOS DE EXEMPLO ===

export async function populateSampleData() {
  const count = await db.capas.count();
  if (count > 0) return count; // já tem dados

  const sampleData = [
    // Apple - vários modelos e tipos
    { modelo: 'iPhone 15 Pro Max', marca: 'Apple', tipo: 'Silicone', cor: 'Preto', preco: 34.90, quantidade: 45, fornecedor: 'ImportCases', dataEntrada: '2025-01-10' },
    { modelo: 'iPhone 15 Pro Max', marca: 'Apple', tipo: 'Transparente', cor: 'Transparente', preco: 19.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2025-01-10' },
    { modelo: 'iPhone 15 Pro', marca: 'Apple', tipo: 'Silicone', cor: 'Azul Marinho', preco: 32.90, quantidade: 28, fornecedor: 'ImportCases', dataEntrada: '2025-01-12' },
    { modelo: 'iPhone 15 Pro', marca: 'Apple', tipo: 'Carteira', cor: 'Marrom', preco: 49.90, quantidade: 3, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-15' },
    { modelo: 'iPhone 15', marca: 'Apple', tipo: 'Rígida', cor: 'Vermelho', preco: 24.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2025-01-08' },
    { modelo: 'iPhone 15', marca: 'Apple', tipo: 'Silicone', cor: 'Rosa', preco: 29.90, quantidade: 15, fornecedor: 'ImportCases', dataEntrada: '2025-01-08' },
    { modelo: 'iPhone 14', marca: 'Apple', tipo: 'Silicone', cor: 'Preto', preco: 24.90, quantidade: 2, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-20' },
    { modelo: 'iPhone 14', marca: 'Apple', tipo: 'Transparente', cor: 'Transparente', preco: 14.90, quantidade: 50, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-20' },
    { modelo: 'iPhone 13', marca: 'Apple', tipo: 'Silicone', cor: 'Verde', preco: 19.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2024-11-10' },
    { modelo: 'iPhone 13', marca: 'Apple', tipo: 'Anti-impacto', cor: 'Preto', preco: 39.90, quantidade: 4, fornecedor: 'ProtectMax', dataEntrada: '2024-11-10' },

    // Samsung
    { modelo: 'Galaxy S24 Ultra', marca: 'Samsung', tipo: 'Silicone', cor: 'Preto', preco: 34.90, quantidade: 35, fornecedor: 'ImportCases', dataEntrada: '2025-01-15' },
    { modelo: 'Galaxy S24 Ultra', marca: 'Samsung', tipo: 'Anti-impacto', cor: 'Azul', preco: 44.90, quantidade: 0, fornecedor: 'ProtectMax', dataEntrada: '2025-01-15' },
    { modelo: 'Galaxy S24', marca: 'Samsung', tipo: 'Transparente', cor: 'Transparente', preco: 17.90, quantidade: 22, fornecedor: 'ImportCases', dataEntrada: '2025-01-14' },
    { modelo: 'Galaxy S24', marca: 'Samsung', tipo: 'Carteira', cor: 'Preto', preco: 44.90, quantidade: 1, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-14' },
    { modelo: 'Galaxy S23', marca: 'Samsung', tipo: 'Silicone', cor: 'Roxo', preco: 24.90, quantidade: 18, fornecedor: 'ImportCases', dataEntrada: '2024-12-01' },
    { modelo: 'Galaxy S23', marca: 'Samsung', tipo: 'Rígida', cor: 'Branco', preco: 22.90, quantidade: 0, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-01' },
    { modelo: 'Galaxy A54', marca: 'Samsung', tipo: 'Silicone', cor: 'Preto', preco: 19.90, quantidade: 40, fornecedor: 'ImportCases', dataEntrada: '2024-12-05' },
    { modelo: 'Galaxy A54', marca: 'Samsung', tipo: 'Transparente', cor: 'Transparente', preco: 12.90, quantidade: 5, fornecedor: 'ImportCases', dataEntrada: '2024-12-05' },
    { modelo: 'Galaxy A34', marca: 'Samsung', tipo: 'Silicone', cor: 'Azul', preco: 17.90, quantidade: 0, fornecedor: 'CaseWholesale', dataEntrada: '2024-11-20' },

    // Motorola
    { modelo: 'Moto G84', marca: 'Motorola', tipo: 'Silicone', cor: 'Preto', preco: 19.90, quantidade: 25, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-05' },
    { modelo: 'Moto G84', marca: 'Motorola', tipo: 'Transparente', cor: 'Transparente', preco: 12.90, quantidade: 3, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-05' },
    { modelo: 'Moto G73', marca: 'Motorola', tipo: 'Anti-impacto', cor: 'Preto', preco: 29.90, quantidade: 0, fornecedor: 'ProtectMax', dataEntrada: '2024-12-10' },
    { modelo: 'Moto G53', marca: 'Motorola', tipo: 'Silicone', cor: 'Azul', preco: 14.90, quantidade: 12, fornecedor: 'ImportCases', dataEntrada: '2024-11-25' },
    { modelo: 'Moto Edge 40', marca: 'Motorola', tipo: 'Rígida', cor: 'Verde', preco: 27.90, quantidade: 2, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-15' },
    { modelo: 'Moto Edge 40', marca: 'Motorola', tipo: 'Carteira', cor: 'Marrom', preco: 39.90, quantidade: 0, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-15' },

    // Xiaomi
    { modelo: 'Redmi Note 13 Pro', marca: 'Xiaomi', tipo: 'Silicone', cor: 'Preto', preco: 17.90, quantidade: 30, fornecedor: 'ImportCases', dataEntrada: '2025-01-08' },
    { modelo: 'Redmi Note 13 Pro', marca: 'Xiaomi', tipo: 'Anti-impacto', cor: 'Vermelho', preco: 34.90, quantidade: 0, fornecedor: 'ProtectMax', dataEntrada: '2025-01-08' },
    { modelo: 'Redmi Note 13', marca: 'Xiaomi', tipo: 'Transparente', cor: 'Transparente', preco: 11.90, quantidade: 4, fornecedor: 'ImportCases', dataEntrada: '2025-01-06' },
    { modelo: 'Poco X6', marca: 'Xiaomi', tipo: 'Silicone', cor: 'Amarelo', preco: 16.90, quantidade: 20, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-18' },
    { modelo: 'Poco X6', marca: 'Xiaomi', tipo: 'Rígida', cor: 'Preto', preco: 21.90, quantidade: 1, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-18' },
    { modelo: 'Mi 14', marca: 'Xiaomi', tipo: 'Silicone', cor: 'Branco', preco: 24.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2025-01-02' },

    // Realme
    { modelo: 'Realme 12 Pro+', marca: 'Realme', tipo: 'Silicone', cor: 'Preto', preco: 16.90, quantidade: 15, fornecedor: 'ImportCases', dataEntrada: '2025-01-03' },
    { modelo: 'Realme 12 Pro+', marca: 'Realme', tipo: 'Transparente', cor: 'Transparente', preco: 10.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2025-01-03' },
    { modelo: 'Realme C55', marca: 'Realme', tipo: 'Silicone', cor: 'Rosa', preco: 12.90, quantidade: 8, fornecedor: 'CaseWholesale', dataEntrada: '2024-12-22' },

    // Extras com variações de cor
    { modelo: 'iPhone 15 Pro Max', marca: 'Apple', tipo: 'Anti-impacto', cor: 'Verde', preco: 42.90, quantidade: 0, fornecedor: 'ProtectMax', dataEntrada: '2025-01-10' },
    { modelo: 'Galaxy S24 Ultra', marca: 'Samsung', tipo: 'Carteira', cor: 'Marrom', preco: 54.90, quantidade: 2, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-15' },
    { modelo: 'iPhone 15 Pro', marca: 'Apple', tipo: 'Rígida', cor: 'Branco', preco: 27.90, quantidade: 0, fornecedor: 'ImportCases', dataEntrada: '2025-01-12' },
    { modelo: 'Galaxy S24', marca: 'Samsung', tipo: 'Silicone', cor: 'Rosa', preco: 24.90, quantidade: 5, fornecedor: 'ImportCases', dataEntrada: '2025-01-14' },
    { modelo: 'Moto G84', marca: 'Motorola', tipo: 'Rígida', cor: 'Azul', preco: 19.90, quantidade: 0, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-05' },
    { modelo: 'Redmi Note 13 Pro', marca: 'Xiaomi', tipo: 'Carteira', cor: 'Preto', preco: 37.90, quantidade: 3, fornecedor: 'CaseWholesale', dataEntrada: '2025-01-08' },
  ];

  await db.capas.bulkAdd(sampleData);

  await db.importacoes.add({
    nomeArquivo: 'dados_exemplo_gerados.xlsx',
    dataImportacao: new Date().toISOString(),
    totalRegistros: sampleData.length,
  });

  return sampleData.length;
}
