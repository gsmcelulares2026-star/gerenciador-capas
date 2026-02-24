import { useState, useEffect } from 'react';
import { getStats, getAllImportacoes } from '../db/db';
import {
    Package,
    DollarSign,
    Layers,
    FileSpreadsheet,
    TrendingUp,
    Clock,
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [importacoes, setImportacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [s, imp] = await Promise.all([getStats(), getAllImportacoes()]);
            setStats(s);
            setImportacoes(imp.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (loading) {
        return (
            <div className="empty-state">
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Visão geral do seu estoque de capas</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total de Modelos</span>
                        <div className="stat-card-icon purple">
                            <Package size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats?.totalModelos || 0}</div>
                    <div className="stat-card-sub">modelos cadastrados</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total de Unidades</span>
                        <div className="stat-card-icon blue">
                            <Layers size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats?.totalUnidades?.toLocaleString('pt-BR') || 0}</div>
                    <div className="stat-card-sub">unidades em estoque</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Valor em Estoque</span>
                        <div className="stat-card-icon green">
                            <DollarSign size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats?.valorTotal || 0)}</div>
                    <div className="stat-card-sub">valor total estimado</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Importações</span>
                        <div className="stat-card-icon yellow">
                            <FileSpreadsheet size={22} />
                        </div>
                    </div>
                    <div className="stat-card-value">{importacoes.length}</div>
                    <div className="stat-card-sub">arquivos importados</div>
                </div>
            </div>

            {/* Top Modelos */}
            {stats?.topModelos && stats.topModelos.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Top 10 Modelos em Estoque</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Modelo</th>
                                    <th>Marca</th>
                                    <th>Tipo</th>
                                    <th>Cor</th>
                                    <th>Qtd</th>
                                    <th>Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topModelos.map((capa, i) => (
                                    <tr key={capa.id}>
                                        <td>{i + 1}</td>
                                        <td><strong>{capa.modelo}</strong></td>
                                        <td>{capa.marca || '-'}</td>
                                        <td>{capa.tipo || '-'}</td>
                                        <td>{capa.cor || '-'}</td>
                                        <td><span className="badge badge-blue">{capa.quantidade}</span></td>
                                        <td>{formatCurrency(capa.preco || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Últimas Importações */}
            <div className="card">
                <div className="card-header">
                    <h3><Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Últimas Importações</h3>
                </div>
                {importacoes.length === 0 ? (
                    <div className="empty-state">
                        <FileSpreadsheet size={48} />
                        <h3>Nenhuma importação realizada</h3>
                        <p>Importe seu primeiro arquivo Excel para começar</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Arquivo</th>
                                    <th>Data</th>
                                    <th>Registros</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importacoes.map(imp => (
                                    <tr key={imp.id}>
                                        <td>{imp.nomeArquivo}</td>
                                        <td>{formatDate(imp.dataImportacao)}</td>
                                        <td><span className="badge badge-green">{imp.totalRegistros}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
