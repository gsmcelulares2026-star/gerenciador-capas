import { useState, useEffect, useMemo } from 'react';
import { getEstoqueReport } from '../db/db';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
    AlertTriangle,
    PackageX,
    PackageCheck,
    Filter,
    Download,
    AlertCircle,
    Layers,
} from 'lucide-react';

const COLORS = {
    zerados: '#ef4444',
    abaixoMinimo: '#f59e0b',
    comEstoque: '#22c55e',
};

const BAR_COLORS = [
    '#6c63ff', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
];

export default function Estoque() {
    const [report, setReport] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCor, setFiltroCor] = useState('');
    const [qtdMinima, setQtdMinima] = useState(5);
    const [activeTab, setActiveTab] = useState('zerados');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, [filtroTipo, filtroCor, qtdMinima]);

    async function loadReport() {
        setLoading(true);
        try {
            const r = await getEstoqueReport({ filtroTipo, filtroCor, qtdMinima });
            setReport(r);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }

    function exportStockReport() {
        if (!report) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Estoque Zerado
        if (report.zerados.length > 0) {
            const wsZerados = XLSX.utils.json_to_sheet(report.zerados.map(c => ({
                Modelo: c.modelo, Marca: c.marca, Tipo: c.tipo, Cor: c.cor,
                Preço: c.preco, Quantidade: c.quantidade, Fornecedor: c.fornecedor,
            })));
            XLSX.utils.book_append_sheet(wb, wsZerados, 'Estoque Zerado');
        }

        // Sheet 2: Abaixo do Mínimo
        if (report.abaixoMinimo.length > 0) {
            const wsAbaixo = XLSX.utils.json_to_sheet(report.abaixoMinimo.map(c => ({
                Modelo: c.modelo, Marca: c.marca, Tipo: c.tipo, Cor: c.cor,
                Preço: c.preco, Quantidade: c.quantidade, Fornecedor: c.fornecedor,
            })));
            XLSX.utils.book_append_sheet(wb, wsAbaixo, 'Abaixo do Mínimo');
        }

        // Sheet 3: Resumo por Tipo
        const tipoData = Object.entries(report.resumoPorTipo).map(([tipo, d]) => ({
            Tipo: tipo, Total: d.total, Zerados: d.zerados, 'Abaixo do Mínimo': d.abaixoMinimo,
        }));
        const wsTipo = XLSX.utils.json_to_sheet(tipoData);
        XLSX.utils.book_append_sheet(wb, wsTipo, 'Resumo por Tipo');

        // Sheet 4: Resumo por Cor
        const corData = Object.entries(report.resumoPorCor).map(([cor, d]) => ({
            Cor: cor, Total: d.total, Zerados: d.zerados, 'Abaixo do Mínimo': d.abaixoMinimo,
        }));
        const wsCor = XLSX.utils.json_to_sheet(corData);
        XLSX.utils.book_append_sheet(wb, wsCor, 'Resumo por Cor');

        XLSX.writeFile(wb, `relatorio_estoque_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // Chart data
    const tipoChartData = useMemo(() => {
        if (!report) return [];
        return Object.entries(report.resumoPorTipo).map(([name, d]) => ({
            name,
            zerados: d.zerados,
            abaixoMinimo: d.abaixoMinimo,
            ok: d.total - d.zerados - d.abaixoMinimo,
        }));
    }, [report]);

    const corChartData = useMemo(() => {
        if (!report) return [];
        return Object.entries(report.resumoPorCor)
            .sort((a, b) => (b[1].zerados + b[1].abaixoMinimo) - (a[1].zerados + a[1].abaixoMinimo))
            .slice(0, 10)
            .map(([name, d]) => ({
                name,
                zerados: d.zerados,
                abaixoMinimo: d.abaixoMinimo,
                ok: d.total - d.zerados - d.abaixoMinimo,
            }));
    }, [report]);

    const activeList = report ? (activeTab === 'zerados' ? report.zerados : report.abaixoMinimo) : [];

    if (loading && !report) {
        return <div className="empty-state"><p>Carregando...</p></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Controle de Estoque</h2>
                    <p>Estoque zerado, quantidade mínima e alertas por tipo e cor</p>
                </div>
                <button className="btn btn-primary" onClick={exportStockReport}>
                    <Download size={16} />
                    Exportar Relatório
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Filter size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Filtros</h3>
                </div>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Tipo de Capa</label>
                        <select className="form-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                            <option value="">Todos os Tipos</option>
                            {report?.tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Cor</label>
                        <select className="form-select" value={filtroCor} onChange={e => setFiltroCor(e.target.value)}>
                            <option value="">Todas as Cores</option>
                            {report?.coresUnicas.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Quantidade Mínima</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            value={qtdMinima}
                            onChange={e => setQtdMinima(parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Estoque Zerado</span>
                        <div className="stat-card-icon red"><PackageX size={22} /></div>
                    </div>
                    <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
                        {report?.zerados.length || 0}
                    </div>
                    <div className="stat-card-sub">produtos sem estoque</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Abaixo do Mínimo</span>
                        <div className="stat-card-icon yellow"><AlertTriangle size={22} /></div>
                    </div>
                    <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
                        {report?.abaixoMinimo.length || 0}
                    </div>
                    <div className="stat-card-sub">com até {qtdMinima} unidades</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Estoque OK</span>
                        <div className="stat-card-icon green"><PackageCheck size={22} /></div>
                    </div>
                    <div className="stat-card-value" style={{ color: 'var(--success)' }}>
                        {report?.comEstoque.length || 0}
                    </div>
                    <div className="stat-card-sub">acima de {qtdMinima} unidades</div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3><Layers size={18} /> Situação por Tipo</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={tipoChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 8,
                                    fontSize: 13,
                                }}
                            />
                            <Bar dataKey="zerados" name="Zerados" stackId="a" fill={COLORS.zerados} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="abaixoMinimo" name="Abaixo Mínimo" stackId="a" fill={COLORS.abaixoMinimo} />
                            <Bar dataKey="ok" name="OK" stackId="a" fill={COLORS.comEstoque} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3><Layers size={18} /> Situação por Cor</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={corChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 8,
                                    fontSize: 13,
                                }}
                            />
                            <Bar dataKey="zerados" name="Zerados" stackId="a" fill={COLORS.zerados} />
                            <Bar dataKey="abaixoMinimo" name="Abaixo Mínimo" stackId="a" fill={COLORS.abaixoMinimo} />
                            <Bar dataKey="ok" name="OK" stackId="a" fill={COLORS.comEstoque} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabs */}
            <div className="card">
                <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('zerados')}
                        style={{
                            padding: '10px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'zerados' ? '2px solid var(--danger)' : '2px solid transparent',
                            color: activeTab === 'zerados' ? 'var(--danger)' : 'var(--text-secondary)',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <PackageX size={16} />
                        Estoque Zerado ({report?.zerados.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('abaixo')}
                        style={{
                            padding: '10px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'abaixo' ? '2px solid var(--warning)' : '2px solid transparent',
                            color: activeTab === 'abaixo' ? 'var(--warning)' : 'var(--text-secondary)',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <AlertTriangle size={16} />
                        Abaixo do Mínimo ({report?.abaixoMinimo.length || 0})
                    </button>
                </div>

                {activeList.length === 0 ? (
                    <div className="empty-state">
                        <PackageCheck size={48} />
                        <h3>Nenhum produto nesta situação</h3>
                        <p>{activeTab === 'zerados' ? 'Todos os produtos possuem estoque' : `Nenhum produto com até ${qtdMinima} unidades`}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Modelo</th>
                                    <th>Marca</th>
                                    <th>Tipo</th>
                                    <th>Cor</th>
                                    <th>Preço</th>
                                    <th>Qtd</th>
                                    <th>Fornecedor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeList.map(capa => (
                                    <tr key={capa.id}>
                                        <td><strong>{capa.modelo}</strong></td>
                                        <td>{capa.marca || '-'}</td>
                                        <td>{capa.tipo || '-'}</td>
                                        <td>{capa.cor || '-'}</td>
                                        <td>{formatCurrency(capa.preco)}</td>
                                        <td>
                                            <span className={`badge ${(Number(capa.quantidade) || 0) === 0 ? 'badge-red' : 'badge-yellow'}`}>
                                                {capa.quantidade || 0}
                                            </span>
                                        </td>
                                        <td>{capa.fornecedor || '-'}</td>
                                        <td>
                                            {(Number(capa.quantidade) || 0) === 0 ? (
                                                <span className="badge badge-red">
                                                    <AlertCircle size={12} style={{ marginRight: 4 }} /> Zerado
                                                </span>
                                            ) : (
                                                <span className="badge badge-yellow">
                                                    <AlertTriangle size={12} style={{ marginRight: 4 }} /> Baixo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Resumo por Tipo e Cor Tables */}
            <div className="charts-grid" style={{ marginTop: 24 }}>
                <div className="card" style={{ margin: 0 }}>
                    <div className="card-header">
                        <h3>Resumo por Tipo</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Total</th>
                                    <th>Zerados</th>
                                    <th>Baixo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(report?.resumoPorTipo || {}).map(([tipo, d]) => (
                                    <tr key={tipo}>
                                        <td><strong>{tipo}</strong></td>
                                        <td>{d.total}</td>
                                        <td>{d.zerados > 0 ? <span className="badge badge-red">{d.zerados}</span> : '0'}</td>
                                        <td>{d.abaixoMinimo > 0 ? <span className="badge badge-yellow">{d.abaixoMinimo}</span> : '0'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                    <div className="card-header">
                        <h3>Resumo por Cor</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cor</th>
                                    <th>Total</th>
                                    <th>Zerados</th>
                                    <th>Baixo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(report?.resumoPorCor || {}).map(([cor, d]) => (
                                    <tr key={cor}>
                                        <td><strong>{cor}</strong></td>
                                        <td>{d.total}</td>
                                        <td>{d.zerados > 0 ? <span className="badge badge-red">{d.zerados}</span> : '0'}</td>
                                        <td>{d.abaixoMinimo > 0 ? <span className="badge badge-yellow">{d.abaixoMinimo}</span> : '0'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
