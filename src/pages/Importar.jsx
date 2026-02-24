import { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { addCapasBulk, addImportacao, getAllImportacoes } from '../db/db';
import Toast from '../components/Toast';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    Download,
    Clock,
    X,
} from 'lucide-react';

// Expected column mappings (flexible matching)
const COLUMN_MAP = {
    modelo: ['modelo', 'model', 'nome', 'name', 'produto', 'product', 'celular', 'aparelho'],
    marca: ['marca', 'brand', 'fabricante', 'manufacturer'],
    tipo: ['tipo', 'type', 'categoria', 'category', 'material'],
    cor: ['cor', 'color', 'colour'],
    preco: ['preco', 'preço', 'price', 'valor', 'value', 'custo', 'cost'],
    quantidade: ['quantidade', 'qty', 'qtd', 'quantity', 'estoque', 'stock', 'quant'],
    fornecedor: ['fornecedor', 'supplier', 'vendor', 'distribuidor'],
    dataEntrada: ['data', 'date', 'data_entrada', 'entrada', 'data entrada'],
    observacoes: ['observacoes', 'observações', 'obs', 'notes', 'notas', 'observacao', 'observação'],
};

function matchColumn(header) {
    const normalized = header.toLowerCase().trim().replace(/[^a-záàâãéêíóôõúç\s_]/gi, '');
    for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.some(alias => normalized.includes(alias))) {
            return field;
        }
    }
    return null;
}

export default function Importar() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [headers, setHeaders] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importacoes, setImportacoes] = useState([]);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadImportacoes();
    }, []);

    async function loadImportacoes() {
        const data = await getAllImportacoes();
        setImportacoes(data);
    }

    const processFile = useCallback((f) => {
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            setToast({ message: 'Formato não suportado. Use .xlsx, .xls ou .csv', type: 'error' });
            return;
        }

        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    setToast({ message: 'A planilha está vazia', type: 'error' });
                    return;
                }

                const fileHeaders = Object.keys(jsonData[0]);
                setHeaders(fileHeaders);

                // Auto-map columns
                const mapping = {};
                fileHeaders.forEach(h => {
                    const matched = matchColumn(h);
                    if (matched) mapping[h] = matched;
                });
                setColumnMapping(mapping);
                setPreviewData(jsonData);
            } catch (err) {
                setToast({ message: 'Erro ao ler a planilha: ' + err.message, type: 'error' });
            }
        };
        reader.readAsArrayBuffer(f);
    }, []);

    function handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }

    function handleFileSelect(e) {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    }

    function updateMapping(header, field) {
        setColumnMapping(prev => {
            const newMapping = { ...prev };
            if (field === '') {
                delete newMapping[header];
            } else {
                // Remove previous mapping for this field
                Object.keys(newMapping).forEach(k => {
                    if (newMapping[k] === field) delete newMapping[k];
                });
                newMapping[header] = field;
            }
            return newMapping;
        });
    }

    async function handleImport() {
        if (previewData.length === 0) return;

        setImporting(true);
        try {
            // Transform data based on column mapping
            const capas = previewData.map(row => {
                const capa = {};
                Object.entries(columnMapping).forEach(([header, field]) => {
                    let value = row[header];
                    if (field === 'preco') {
                        value = parseFloat(String(value).replace(',', '.').replace(/[^\d.]/g, '')) || 0;
                    } else if (field === 'quantidade') {
                        value = parseInt(String(value).replace(/[^\d]/g, '')) || 0;
                    } else {
                        value = String(value || '').trim();
                    }
                    capa[field] = value;
                });
                return capa;
            });

            await addCapasBulk(capas);
            await addImportacao({
                nomeArquivo: file.name,
                totalRegistros: capas.length,
            });

            setToast({ message: `${capas.length} registros importados com sucesso!`, type: 'success' });
            setFile(null);
            setPreviewData([]);
            setHeaders([]);
            setColumnMapping({});
            loadImportacoes();
        } catch (err) {
            setToast({ message: 'Erro ao importar: ' + err.message, type: 'error' });
        } finally {
            setImporting(false);
        }
    }

    function cancelImport() {
        setFile(null);
        setPreviewData([]);
        setHeaders([]);
        setColumnMapping({});
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

    function downloadTemplate() {
        const templateData = [
            {
                Modelo: 'iPhone 15 Pro',
                Marca: 'Apple',
                Tipo: 'Silicone',
                Cor: 'Preto',
                Preço: 29.90,
                Quantidade: 50,
                Fornecedor: 'Fornecedor A',
                'Data Entrada': '2024-01-15',
                Observações: 'Modelo mais vendido',
            },
            {
                Modelo: 'Galaxy S24',
                Marca: 'Samsung',
                Tipo: 'Rígida',
                Cor: 'Transparente',
                Preço: 24.90,
                Quantidade: 30,
                Fornecedor: 'Fornecedor B',
                'Data Entrada': '2024-01-20',
                Observações: '',
            },
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Capas');
        XLSX.writeFile(wb, 'template_capas.xlsx');
    }

    return (
        <div>
            <div className="page-header">
                <h2>Importar Excel</h2>
                <p>Importe seus dados de capas a partir de planilhas Excel</p>
            </div>

            {/* Dropzone */}
            {!file && (
                <div className="card">
                    <div
                        className={`dropzone ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="dropzone-icon">
                            <Upload size={28} />
                        </div>
                        <h3>Arraste e solte seu arquivo aqui</h3>
                        <p>ou clique para selecionar — Suporta .xlsx, .xls e .csv</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <button className="btn btn-secondary" onClick={downloadTemplate}>
                            <Download size={16} />
                            Baixar Modelo de Planilha
                        </button>
                    </div>
                </div>
            )}

            {/* Preview */}
            {file && previewData.length > 0 && (
                <div className="preview-container">
                    <div className="card">
                        <div className="preview-header">
                            <h3>
                                <FileSpreadsheet size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                {file.name}
                            </h3>
                            <button className="btn btn-secondary btn-sm" onClick={cancelImport}>
                                <X size={14} /> Cancelar
                            </button>
                        </div>

                        <div className="preview-info">
                            <span><strong>{previewData.length}</strong> registros encontrados</span>
                            <span><strong>{Object.keys(columnMapping).length}</strong> colunas mapeadas</span>
                        </div>

                        {/* Column Mapping */}
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
                                Mapeamento de Colunas
                            </h4>
                            <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                {headers.map(h => (
                                    <div key={h} className="form-group" style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: 12 }}>{h}</label>
                                        <select
                                            className="form-select"
                                            value={columnMapping[h] || ''}
                                            onChange={e => updateMapping(h, e.target.value)}
                                            style={{ padding: '6px 32px 6px 10px', fontSize: 13 }}
                                        >
                                            <option value="">— Ignorar —</option>
                                            <option value="modelo">Modelo</option>
                                            <option value="marca">Marca</option>
                                            <option value="tipo">Tipo</option>
                                            <option value="cor">Cor</option>
                                            <option value="preco">Preço</option>
                                            <option value="quantidade">Quantidade</option>
                                            <option value="fornecedor">Fornecedor</option>
                                            <option value="dataEntrada">Data Entrada</option>
                                            <option value="observacoes">Observações</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        {headers.map(h => (
                                            <th key={h}>
                                                {h}
                                                {columnMapping[h] && (
                                                    <span className="badge badge-purple" style={{ marginLeft: 6 }}>
                                                        {columnMapping[h]}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 20).map((row, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            {headers.map(h => (
                                                <td key={h}>{String(row[h] ?? '')}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {previewData.length > 20 && (
                                        <tr>
                                            <td colSpan={headers.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                ... e mais {previewData.length - 20} registros
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Import Button */}
                        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={cancelImport}>
                                <X size={16} /> Cancelar
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleImport}
                                disabled={importing || Object.keys(columnMapping).length === 0}
                            >
                                <CheckCircle size={16} />
                                {importing ? 'Importando...' : `Importar ${previewData.length} Registros`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import History */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>
                        <Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Histórico de Importações
                    </h3>
                </div>
                {importacoes.length === 0 ? (
                    <div className="empty-state">
                        <FileSpreadsheet size={48} />
                        <h3>Nenhuma importação realizada</h3>
                        <p>Importe seu primeiro arquivo para ver o histórico aqui</p>
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
                                        <td>
                                            <FileSpreadsheet size={14} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--success)' }} />
                                            {imp.nomeArquivo}
                                        </td>
                                        <td>{formatDate(imp.dataImportacao)}</td>
                                        <td><span className="badge badge-green">{imp.totalRegistros}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
