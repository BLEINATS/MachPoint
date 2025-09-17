# MachPoint - Sistema de Gestão de Arena Esportiva

## Visão Geral
MachPoint é uma aplicação React TypeScript para gestão completa de arena esportiva, incluindo gestão de quadras, reservas, torneios, eventos e alunos. A aplicação utiliza Supabase como backend principal para autenticação e banco de dados.

## Mudanças Recentes
- **17/09/2025**: Importação bem-sucedida do repositório correto BLEINATS/MachPoint
- **17/09/2025**: Configuração do Supabase com chaves de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- **17/09/2025**: Configuração do Vite com detecção automática de ambiente Replit para hosts permitidos

## Preferências do Usuário
- Desenvolvimento em equipe utilizando Git compartilhado
- Compatibilidade com plataforma Dualite e outros ambientes de desenvolvimento
- Comunicação em português brasileiro

## Arquitetura do Projeto
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **Roteamento**: React Router DOM
- **Estado**: Context API (Auth, Theme, Toast)

### Estrutura Principal
- `src/components/`: Componentes organizados por funcionalidade (Alunos, Auth, Client, Dashboard, etc.)
- `src/pages/`: Páginas principais da aplicação
- `src/context/`: Gerenciamento de estado global
- `src/lib/`: Configuração do Supabase
- `src/types/`: Definições TypeScript
- `supabase/migrations/`: Scripts de migração do banco

### Configuração de Ambiente
- Vite configurado para detectar automaticamente ambiente Replit
- Host 0.0.0.0:5000 para compatibilidade com proxy Replit
- Polling habilitado para ambientes containerizados
- allowedHosts configurado dinamicamente baseado no ambiente
