import { useState, useEffect, useMemo } from 'react';
import { getAllCapas, addCapa, updateCapa, deleteCapa } from '../db/db';
import Toast from '../components/Toast';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    Smartphone,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const emptyForm = {
    modelo: '',
    marca: '',
    tipo: '',
    cor: '',
    preco: '',
    quantidade: '',
    fornecedor: '',
    dataEntrada: '',
    observacoes: '',
};

export default function Produtos() {
    const [capas, setCapas] = useState([]);
    const [search, setSearch] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCapas();
    }, []);

    async function loadCapas() {
        try {
            const data = await getAllCapas();
            setCapas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Unique values for filters
    const marcas = useMemo(() => [...new Set(capas.map(c => c.marca).filter(Boolean))].sort(), [capas]);
    const tipos = useMemo(() => [...new Set(capas.map(c => c.tipo).filter(Boolean))].sort(), [capas]);

    // Filtered and searched data
    const filtered = useMemo(() => {
        return capas.filter(c => {
            const matchSearch = !search ||
                (c.modelo || '').toLowerCase().includes(search.toLowerCase()) ||
                (c.marca || '').toLowerCase().includes(search.toLowerCase()) ||
                (c.cor || '').toLowerCase().includes(search.toLowerCase()) ||
                (c.fornecedor || '').toLowerCase().includes(search.toLowerCase());
            const matchMarca = !filterMarca || c.marca === filterMarca;
            const matchTipo = !filterTipo || c.tipo === filterTipo;
            return matchSearch && matchMarca && matchTipo;
        });
    }, [capas, search, filterMarca, filterTipo]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => {
        setPage(1);
    }, [search, filterMarca, filterTipo]);

    function openAddModal() {
        setForm(emptyForm);
        setEditingId(null);
        setShowModal(true);
    }

    function openEditModal(capa) {
        setForm({
            modelo: capa.modelo || '',
            marca: capa.marca || '',
            tipo: capa.tipo || '',
            cor: capa.cor || '',
            preco: capa.preco?.toString() || '',
            quantidade: capa.quantidade?.toString() || '',
            fornecedor: capa.fornecedor || '',
            dataEntrada: capa.dataEntrada || '',
            observacoes: capa.observacoes || '',
        });
        setEditingId(capa.id);
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.modelo.trim()) {
            setToast({ message: 'O campo Modelo é obrigatório', type: 'error' });
            return;
        }

        const data = {
            ...form,
            preco: parseFloat(form.preco) || 0,
            quantidade: parseInt(form.quantidade) || 0,
        };

        try {
            if (editingId) {
                await updateCapa(editingId, data);
                setToast({ message: 'Produto atualizado com sucesso!', type: 'success' });
            } else {
                await addCapa(data);
                setToast({ message: 'Produto adicionado com sucesso!', type: 'success' });
            }
            setShowModal(false);
            loadCapas();
        } catch (err) {
            setToast({ message: 'Erro ao salvar: ' + err.message, type: 'error' });
        }
    }

    async function handleDelete(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            await deleteCapa(id);
            setToast({ message: 'Produto excluído com sucesso!', type: 'success' });
            loadCapas();
        } catch (err) {
            setToast({ message: 'Erro ao excluir: ' + err.message, type: 'error' });
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }

    if (loading) {
        return <div className="empty-state"><p>Carregando...</p></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Produtos</h2>
                <p>Gerencie seu catálogo de capas para celular</p>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por modelo, marca, cor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-row">
                    <select value={filterMarca} onChange={e => setFilterMarca(e.target.value)}>
                        <option value="">Todas as Marcas</option>
                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                        <option value="">Todos os Tipos</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={16} />
                        Adicionar
                    </button>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Smartphone size={48} />
                        <h3>Nenhum produto encontrado</h3>
                        <p>Adicione produtos manualmente ou importe via Excel</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: 0 }}>
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
                                        <th>Entrada</th>
                                        <th style={{ width: 90 }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map(capa => (
                                        <tr key={capa.id}>
                                            <td><strong>{capa.modelo}</strong></td>
                                            <td>{capa.marca || '-'}</td>
                                            <td>{capa.tipo || '-'}</td>
                                            <td>{capa.cor || '-'}</td>
                                            <td>{formatCurrency(capa.preco)}</td>
                                            <td><span className="badge badge-blue">{capa.quantidade || 0}</span></td>
                                            <td>{capa.fornecedor || '-'}</td>
                                            <td>{capa.dataEntrada || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn-icon" onClick={() => openEditModal(capa)} title="Editar">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={() => handleDelete(capa.id)} title="Excluir">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (page <= 4) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 3) {
                                    pageNum = totalPages - 6 + i;
                                } else {
                                    pageNum = page - 3 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={page === pageNum ? 'active' : ''}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight size={14} />
                            </button>
                            <span className="pagination-info">{filtered.length} registros</span>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Modelo *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Ex: iPhone 15 Pro"
                                    value={form.modelo}
                                    onChange={e => setForm({ ...form, modelo: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Marca</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Ex: Apple"
                                    value={form.marca}
                                    onChange={e => setForm({ ...form, marca: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Ex: Silicone, Rígida"
                                    value={form.tipo}
                                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Cor</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Ex: Preto, Azul"
                                    value={form.cor}
                                    onChange={e => setForm({ ...form, cor: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Preço (R$)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.preco}
                                    onChange={e => setForm({ ...form, preco: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    placeholder="0"
                                    value={form.quantidade}
                                    onChange={e => setForm({ ...form, quantidade: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Fornecedor</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Nome do fornecedor"
                                    value={form.fornecedor}
                                    onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Data de Entrada</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={form.dataEntrada}
                                    onChange={e => setForm({ ...form, dataEntrada: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Observações</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Observações adicionais..."
                                value={form.observacoes}
                                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                <X size={16} /> Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Save size={16} /> {editingId ? 'Atualizar' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
