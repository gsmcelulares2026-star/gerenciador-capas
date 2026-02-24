import { useState, useEffect } from 'react';
import { getStats } from '../db/db';
import * as XLSX from 'xlsx';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    BarChart3,
    PieChart as PieChartIcon,
    Download,
    TrendingUp,
    DollarSign,
} from 'lucide-react';

const COLORS = [
    '#6c63ff', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
    '#06b6d4', '#84cc16',
];

export default function Relatorios() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const s = await getStats();
            setStats(s);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function prepareChartData(obj) {
        return Object.entries(obj).map(([name, data]) => ({
            name,
            quantidade: data.quantidade || 0,
            valor: data.valor || 0,
        }));
    }

    function exportReport() {
        if (!stats) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Resumo Geral
        const resumo = [
            ['Relatório de Capas para Celular'],
            ['Gerado em', new Date().toLocaleDateString('pt-BR')],
            [],
            ['Total de Modelos', stats.totalModelos],
            ['Total de Unidades', stats.totalUnidades],
            ['Valor Total em Estoque', stats.valorTotal],
        ];
        const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

        // Sheet 2: Por Marca
        const marcaData = prepareChartData(stats.porMarca);
        const wsMarca = XLSX.utils.json_to_sheet(marcaData.map(d => ({
            Marca: d.name,
            Quantidade: d.quantidade,
            'Valor em Estoque': d.valor,
        })));
        XLSX.utils.book_append_sheet(wb, wsMarca, 'Por Marca');

        // Sheet 3: Por Tipo
        const tipoData = prepareChartData(stats.porTipo);
        const wsTipo = XLSX.utils.json_to_sheet(tipoData.map(d => ({
            Tipo: d.name,
            Quantidade: d.quantidade,
            'Valor em Estoque': d.valor,
        })));
        XLSX.utils.book_append_sheet(wb, wsTipo, 'Por Tipo');

        // Sheet 4: Top Modelos
        const wsTop = XLSX.utils.json_to_sheet(stats.topModelos.map(c => ({
            Modelo: c.modelo,
            Marca: c.marca,
            Tipo: c.tipo,
            Cor: c.cor,
            Preço: c.preco,
            Quantidade: c.quantidade,
            Fornecedor: c.fornecedor,
        })));
        XLSX.utils.book_append_sheet(wb, wsTop, 'Top Modelos');

        XLSX.writeFile(wb, `relatorio_capas_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
            }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color }}>
                        {entry.name}: {entry.name.includes('Valor') ? formatCurrency(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="empty-state"><p>Carregando...</p></div>;
    }

    if (!stats || stats.totalModelos === 0) {
        return (
            <div>
                <div className="page-header">
                    <h2>Relatórios</h2>
                    <p>Visualize dados e estatísticas do seu estoque</p>
                </div>
                <div className="card">
                    <div className="empty-state">
                        <BarChart3 size={48} />
                        <h3>Sem dados para exibir</h3>
                        <p>Importe dados ou cadastre produtos para gerar relatórios</p>
                    </div>
                </div>
            </div>
        );
    }

    const marcaData = prepareChartData(stats.porMarca);
    const tipoData = prepareChartData(stats.porTipo);
    const corData = Object.entries(stats.porCor).map(([name, data]) => ({
        name,
        quantidade: data.quantidade,
    }));

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Relatórios</h2>
                    <p>Visualize dados e estatísticas do seu estoque</p>
                </div>
                <button className="btn btn-primary" onClick={exportReport}>
                    <Download size={16} />
                    Exportar Excel
                </button>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Modelos</span>
                        <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.totalModelos}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Unidades</span>
                        <div className="stat-card-icon blue"><BarChart3 size={20} /></div>
                    </div>
                    <div className="stat-card-value">{stats.totalUnidades.toLocaleString('pt-BR')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Valor Total</span>
                        <div className="stat-card-icon green"><DollarSign size={20} /></div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.valorTotal)}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* Pie Chart - Por Marca */}
                <div className="chart-card">
                    <h3><PieChartIcon size={18} /> Distribuição por Marca</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={marcaData}
                                dataKey="quantidade"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={55}
                                paddingAngle={2}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={true}
                            >
                                {marcaData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart - Por Tipo */}
                <div className="chart-card">
                    <h3><BarChart3 size={18} /> Quantidade por Tipo</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tipoData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="quantidade" name="Quantidade" radius={[6, 6, 0, 0]}>
                                {tipoData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart - Top Modelos */}
                <div className="chart-card">
                    <h3><TrendingUp size={18} /> Top 10 Modelos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.topModelos} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis
                                dataKey="modelo"
                                type="category"
                                width={140}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="quantidade" name="Quantidade" radius={[0, 6, 6, 0]}>
                                {stats.topModelos.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie - Por Cor */}
                <div className="chart-card">
                    <h3><PieChartIcon size={18} /> Distribuição por Cor</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={corData}
                                dataKey="quantidade"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={55}
                                paddingAngle={2}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={true}
                            >
                                {corData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table: Valor por Marca */}
            <div className="card">
                <div className="card-header">
                    <h3><DollarSign size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Valor em Estoque por Marca</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Marca</th>
                                <th>Quantidade</th>
                                <th>Valor em Estoque</th>
                                <th>% do Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marcaData
                                .sort((a, b) => b.valor - a.valor)
                                .map(item => (
                                    <tr key={item.name}>
                                        <td><strong>{item.name}</strong></td>
                                        <td><span className="badge badge-blue">{item.quantidade}</span></td>
                                        <td>{formatCurrency(item.valor)}</td>
                                        <td>
                                            <span className="badge badge-purple">
                                                {stats.valorTotal > 0 ? ((item.valor / stats.valorTotal) * 100).toFixed(1) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
