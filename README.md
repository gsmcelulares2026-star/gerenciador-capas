# CapasReport

> Sistema de gestão de capas para celulares, desenvolvido em React + Vite.

## Descrição

CapasReport é uma aplicação web para controle de estoque, importação, cadastro e geração de relatórios de capas para celulares. O sistema permite importar dados via Excel, gerenciar produtos, visualizar estatísticas e gerar relatórios gráficos.

## Funcionalidades

- Dashboard com estatísticas de estoque e importações
- Cadastro, edição e exclusão de capas
- Importação de dados via arquivos Excel
- Controle de estoque (quantidade, alertas de mínimo, cores, tipos)
- Relatórios gráficos e exportação para Excel
- Navegação intuitiva com sidebar

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/gsmcelulares2026-star/gerenciador-capas.git
   cd gerenciador-capas
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

- `src/pages/`: Páginas principais (Dashboard, Produtos, Importar, Estoque, Relatórios)
- `src/components/`: Componentes reutilizáveis (Layout, Sidebar, Toast)
- `src/db/`: Banco local (Dexie.js) e funções de CRUD
- `public/`: Assets públicos

## Tecnologias Utilizadas

- React 19
- Vite
- Dexie.js (IndexedDB)
- Recharts (gráficos)
- XLSX (importação/exportação Excel)
- Lucide React (ícones)

## Uso

- Acesse o sistema em `http://localhost:5173` após iniciar o servidor.
- Importe arquivos Excel para cadastrar capas.
- Navegue pelas páginas para visualizar, editar e gerar relatórios.

## Licença

Este projeto é privado e destinado ao uso interno da GSM Celulares.

## Contato

Dúvidas ou sugestões: [gsmcelulares2026-star](https://github.com/gsmcelulares2026-star)
