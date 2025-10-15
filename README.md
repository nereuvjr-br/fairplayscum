# Next.js 15 + Shadcn UI + Tailwind CSS v4

Este é um projeto moderno construído com as tecnologias mais recentes:

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router e Server Components
- **Shadcn UI** - Biblioteca de componentes reutilizáveis e customizáveis
- **Tailwind CSS v4** - Framework CSS utilitário de nova geração
- **TypeScript** - Tipagem estática para JavaScript
- **Turbopack** - Bundler de alta performance

## 📦 Estrutura do Projeto

```
nextjs-project/
├── src/
│   ├── app/                 # App Router (Next.js 13+)
│   │   ├── globals.css      # Estilos globais com Tailwind
│   │   └── page.tsx         # Página inicial
│   ├── components/
│   │   └── ui/              # Componentes do Shadcn UI
│   └── lib/
│       └── utils.ts         # Utilitários do Shadcn UI
├── public/                  # Arquivos estáticos
├── tailwind.config.ts       # Configuração do Tailwind CSS v4
├── components.json          # Configuração do Shadcn UI
└── package.json
```

## 🛠️ Como usar

### Instalação das dependências
```bash
npm install
```

### Executar em desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build para produção
```bash
npm run build
npm start
```

## 🎨 Shadcn UI

O projeto já inclui alguns componentes básicos:
- Button
- Card (CardContent, CardDescription, CardHeader, CardTitle)

Para adicionar mais componentes:
```bash
npx shadcn@latest add [component-name]
```

Exemplos:
```bash
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
```

## 🎯 Recursos Incluídos

- ✅ Next.js 15 com App Router
- ✅ Tailwind CSS v4
- ✅ Shadcn UI configurado
- ✅ TypeScript
- ✅ ESLint
- ✅ Turbopack para desenvolvimento rápido
- ✅ Design system com variáveis CSS
- ✅ Tema claro/escuro configurado
- ✅ Página de exemplo com componentes

## 📚 Documentação

- [Next.js](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🚀 Deploy

O projeto está pronto para deploy em:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)

Para deploy na Vercel:
```bash
npm i -g vercel
vercel
```
