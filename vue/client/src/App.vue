<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ─── Konstanty ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Nájem', 'Pojištění', 'Auto', 'Jídlo', 'Zábava', 'Energie / Služby', 'Ostatní'];

const CAT_COLORS = {
  'Nájem':            '#818cf8',
  'Pojištění':        '#34d399',
  'Auto':             '#f59e0b',
  'Jídlo':            '#f87171',
  'Zábava':           '#a78bfa',
  'Energie / Služby': '#38bdf8',
  'Ostatní':          '#94a3b8',
};

const MONTHS = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
];

// ─── Stav aplikace ────────────────────────────────────────────────────────────
const activeTab      = ref('expenses');
const currentMonth   = ref(new Date().getMonth() + 1);
const currentYear    = ref(new Date().getFullYear());
const selectedCat    = ref('');
const expenses       = ref([]);
const stats          = ref([]);
const loading        = ref(false);
const showForm       = ref(false);
const editingId      = ref(null);

const emptyForm = () => ({
  date:         new Date().toISOString().split('T')[0],
  category:     '',
  description:  '',
  amount:       '',
  isRecurring:  false,
  recurringDay: 1,
});
const form = ref(emptyForm());

const years = computed(() => {
  const y = new Date().getFullYear();
  return [y - 2, y - 1, y, y + 1];
});

const totalAmount = computed(() =>
  expenses.value.reduce((s, e) => s + e.amount, 0)
);

const maxStatTotal = computed(() =>
  stats.value.length ? Math.max(...stats.value.map(s => s.total)) : 1
);

// ─── API volání ───────────────────────────────────────────────────────────────
const fetchExpenses = async () => {
  loading.value = true;
  try {
    const params = { month: currentMonth.value, year: currentYear.value };
    if (selectedCat.value) params.category = selectedCat.value;
    const res = await axios.get('/api/expenses', { params });
    expenses.value = res.data;
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  const res = await axios.get('/api/expenses/stats', {
    params: { month: currentMonth.value, year: currentYear.value },
  });
  stats.value = res.data;
};

const refreshAll = () => {
  fetchExpenses();
  fetchStats();
};

// ─── Grafy ────────────────────────────────────────────────────────────────────
let pieChart = null;
let barChart = null;

const buildCharts = async () => {
  await nextTick();
  const labels = stats.value.map(s => s._id);
  const data   = stats.value.map(s => s.total);
  const colors = labels.map(l => CAT_COLORS[l] ?? '#94a3b8');

  const commonLegend = { labels: { color: '#f8fafc', boxWidth: 14, padding: 16 } };

  const pieEl = document.getElementById('pieChart');
  if (pieEl) {
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieEl, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#1e293b' }] },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: { legend: commonLegend },
      },
    });
  }

  const barEl = document.getElementById('barChart');
  if (barEl) {
    if (barChart) barChart.destroy();
    barChart = new Chart(barEl, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Výdaje (Kč)', data, backgroundColor: colors, borderRadius: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8', callback: v => formatAmount(v) }, grid: { color: '#334155' } },
        },
      },
    });
  }
};

// ─── Formulář ─────────────────────────────────────────────────────────────────
const openAdd = () => {
  form.value  = emptyForm();
  editingId.value = null;
  showForm.value  = true;
};

const openEdit = (expense) => {
  editingId.value = expense._id;
  form.value = {
    date:         expense.date.split('T')[0],
    category:     expense.category,
    description:  expense.description,
    amount:       expense.amount,
    isRecurring:  expense.isRecurring,
    recurringDay: expense.recurringDay ?? 1,
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value  = false;
  editingId.value = null;
};

const saveExpense = async () => {
  const payload = { ...form.value, amount: parseFloat(form.value.amount) };
  if (editingId.value) {
    await axios.put(`/api/expenses/${editingId.value}`, payload);
  } else {
    await axios.post('/api/expenses', payload);
  }
  closeForm();
  refreshAll();
};

const deleteExpense = async (id) => {
  if (!confirm('Opravdu chcete smazat tento výdaj?')) return;
  await axios.delete(`/api/expenses/${id}`);
  refreshAll();
};

// ─── Formátování ──────────────────────────────────────────────────────────────
const formatAmount = (v) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('cs-CZ');

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch([currentMonth, currentYear, selectedCat], refreshAll);
watch(activeTab, tab => { if (tab === 'dashboard') buildCharts(); });
watch(stats, () => { if (activeTab.value === 'dashboard') buildCharts(); });

onMounted(refreshAll);
</script>

<template>
  <!-- Header -->
  <header class="app-header">
    <h1>💰 Tracker výdajů</h1>
    <nav class="nav-tabs">
      <button class="nav-tab" :class="{ active: activeTab === 'expenses' }" @click="activeTab = 'expenses'">
        📋 Výdaje
      </button>
      <button class="nav-tab" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
        📊 Dashboard
      </button>
    </nav>
  </header>

  <main class="main-content">

    <!-- ═══════════════════ TAB: VÝDAJE ═══════════════════ -->
    <div v-if="activeTab === 'expenses'" class="section-gap">

      <!-- Filtry + celkový součet -->
      <div class="card">
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div class="filters-bar">
              <div class="filter-group">
                <label>Měsíc</label>
                <select v-model="currentMonth">
                  <option v-for="(name, i) in MONTHS" :key="i" :value="i + 1">{{ name }}</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Rok</label>
                <select v-model="currentYear">
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Kategorie</label>
                <select v-model="selectedCat">
                  <option value="">Všechny</option>
                  <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>
            <div class="total-display">
              <span class="total-label">Celkem za měsíc</span>
              <span class="total-badge">{{ formatAmount(totalAmount) }}</span>
              <button class="btn btn-primary" @click="openAdd">+ Přidat výdaj</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabulka výdajů -->
      <div class="card">
        <div class="card-header">
          <h2>Výdaje · {{ MONTHS[currentMonth - 1] }} {{ currentYear }}</h2>
          <span style="font-size:0.85rem; color:var(--text-muted)">{{ expenses.length }} položek</span>
        </div>
        <div class="table-wrapper">
          <div v-if="loading" class="empty-state">Načítám…</div>
          <div v-else-if="expenses.length === 0" class="empty-state">
            Žádné výdaje pro zvolené období.<br>
            <button class="btn btn-primary" style="margin-top:1rem" @click="openAdd">Přidat první výdaj</button>
          </div>
          <table v-else>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kategorie</th>
                <th>Popis</th>
                <th>Opakovaná</th>
                <th style="text-align:right">Částka</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in expenses" :key="e._id">
                <td>{{ formatDate(e.date) }}</td>
                <td>
                  <span class="category-badge"
                    :style="{ background: (CAT_COLORS[e.category] ?? '#94a3b8') + '22', color: CAT_COLORS[e.category] ?? '#94a3b8' }">
                    {{ e.category }}
                  </span>
                </td>
                <td>{{ e.description }}</td>
                <td>
                  <span v-if="e.isRecurring" class="recurring-badge">
                    🔁 den {{ e.recurringDay }}
                  </span>
                  <span v-else style="color:var(--text-muted); font-size:0.8rem">–</span>
                </td>
                <td class="amount-cell" style="text-align:right">{{ formatAmount(e.amount) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon edit" title="Upravit" @click="openEdit(e)">✏️</button>
                    <button class="btn-icon delete" title="Smazat" @click="deleteExpense(e._id)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ TAB: DASHBOARD ═══════════════════ -->
    <div v-if="activeTab === 'dashboard'" class="section-gap">

      <!-- Filtr měsíce pro dashboard -->
      <div class="card">
        <div class="card-body">
          <div class="filters-bar">
            <div class="filter-group">
              <label>Měsíc</label>
              <select v-model="currentMonth">
                <option v-for="(name, i) in MONTHS" :key="i" :value="i + 1">{{ name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Rok</label>
              <select v-model="currentYear">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat karty -->
      <div class="stat-cards">
        <div class="stat-card">
          <span class="stat-card-label">Celkové výdaje</span>
          <span class="stat-card-value">{{ formatAmount(totalAmount) }}</span>
          <span class="stat-card-sub">{{ MONTHS[currentMonth - 1] }} {{ currentYear }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Počet výdajů</span>
          <span class="stat-card-value">{{ expenses.length }}</span>
          <span class="stat-card-sub">položek</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Průměrný výdaj</span>
          <span class="stat-card-value">{{ expenses.length ? formatAmount(totalAmount / expenses.length) : '–' }}</span>
          <span class="stat-card-sub">na položku</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Opakované platby</span>
          <span class="stat-card-value">{{ expenses.filter(e => e.isRecurring).length }}</span>
          <span class="stat-card-sub">položek</span>
        </div>
      </div>

      <!-- Grafy + přehled kategorií -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h2>Výdaje dle kategorií</h2></div>
          <div class="chart-container" style="max-height:300px">
            <canvas id="pieChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2>Srovnání kategorií</h2></div>
          <div class="chart-container" style="max-height:300px">
            <canvas id="barChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Přehled kategorií s progress bary -->
      <div class="card">
        <div class="card-header"><h2>Přehled kategorií</h2></div>
        <div v-if="stats.length === 0" class="empty-state">Žádná data pro toto období.</div>
        <div v-else class="category-list">
          <div v-for="s in stats" :key="s._id" class="category-row">
            <span class="cat-dot" :style="{ background: CAT_COLORS[s._id] ?? '#94a3b8' }"></span>
            <span class="cat-name">{{ s._id }}</span>
            <div class="cat-bar-wrap">
              <div class="cat-bar"
                :style="{ width: (s.total / maxStatTotal * 100) + '%', background: CAT_COLORS[s._id] ?? '#94a3b8' }">
              </div>
            </div>
            <span class="cat-amount" :style="{ color: CAT_COLORS[s._id] ?? '#94a3b8' }">
              {{ formatAmount(s.total) }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </main>

  <!-- ═══════════════════ MODAL: FORMULÁŘ ═══════════════════ -->
  <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editingId ? 'Upravit výdaj' : 'Nový výdaj' }}</h2>
        <button class="btn-close" @click="closeForm">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-field">
            <label>Datum</label>
            <input type="date" v-model="form.date" required />
          </div>
          <div class="form-field">
            <label>Částka (Kč)</label>
            <input type="number" v-model="form.amount" min="0" step="1" placeholder="0" required />
          </div>
        </div>
        <div class="form-field">
          <label>Kategorie</label>
          <select v-model="form.category" required>
            <option value="" disabled>Vyberte kategorii…</option>
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>Popis</label>
          <input type="text" v-model="form.description" placeholder="Popis výdaje…" required />
        </div>
        <label class="checkbox-row">
          <input type="checkbox" v-model="form.isRecurring" />
          Opakovaná platba (nájem, pojištění, předplatné…)
        </label>
        <div v-if="form.isRecurring" class="form-field">
          <label>Den v měsíci</label>
          <input type="number" v-model="form.recurringDay" min="1" max="31" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeForm">Zrušit</button>
        <button class="btn btn-primary" @click="saveExpense"
          :disabled="!form.date || !form.category || !form.description || !form.amount">
          {{ editingId ? 'Uložit změny' : 'Přidat výdaj' }}
        </button>
      </div>
    </div>
  </div>
</template>
