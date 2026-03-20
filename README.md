# 🚀 Tracker App

Moderní full-stack aplikace postavená na **Vue 3** a **Node.js (Express)** s čistým Dark Mode UI.

## 🛠 Tech Stack

- **Frontend:** Vue.js 3 (Vite, Composition API, Axios)
- **Backend:** Node.js (Express, CORS)
- **Styling:** Custom Modern CSS (Dark UI, Glassmorphism)
- **Nástroje:** Concurrently (pro souběžné spouštění)

## 🏗 Struktura projektu

- `/server` - Express API server (port 3000)
- `/vue/client` - Vite + Vue frontend (port 5173)
- `package.json` - Kořenová konfigurace pro ovládání celého monorepa

## 🚀 Rychlý start

### 1. Instalace závislostí
V kořenovém adresáři spusťte:
```bash
npm install
```
*(Tento příkaz nainstaluje potřebné nástroje pro spouštění projektu)*

### 2. Spuštění vývojového prostředí
Pro spuštění backendu i frontendu najednou použijte:
```bash
npm run dev
```

### 3. Otevření aplikace
Po spuštění bude aplikace dostupná na:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000/api/hello](http://localhost:3000/api/hello)

## 🎨 Vlastnosti UI

- **Moderní Dark Mode:** Využívá barevnou paletu Slate a Indigo.
- **Glassmorphism:** Průhledné prvky s efektem rozostření pozadí.
- **Responsive Design:** Plně funkční na mobilních zařízeních i desktopu.
- **Loading & Error states:** Ošetřené stavy při komunikaci s API.

## 📝 Konfigurace Proxy
Frontend je nakonfigurován tak, aby automaticky přesměroval požadavky začínající na `/api` na lokální Express server, což eliminuje problémy s CORS během vývoje.
