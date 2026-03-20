const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/tracker')
  .then(() => console.log('MongoDB připojeno'))
  .catch(err => console.error('Chyba připojení k MongoDB:', err));

const CATEGORIES = ['Nájem', 'Pojištění', 'Auto', 'Jídlo', 'Zábava', 'Energie / Služby', 'Ostatní'];

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: { type: String, required: true, enum: CATEGORIES },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number, min: 1, max: 31, default: 1 },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

// GET výdaje s volitelným filtrem měsíce a kategorie
app.get('/api/expenses', async (req, res) => {
  try {
    const { month, year, category } = req.query;
    const filter = {};
    if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }
    if (category) filter.category = category;
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET statistiky pro dashboard (musí být před /:id)
app.get('/api/expenses/stats', async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }
    const stats = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST vytvoření výdaje
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT úprava výdaje
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!expense) return res.status(404).json({ error: 'Výdaj nenalezen' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE smazání výdaje
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Výdaj nenalezen' });
    res.json({ message: 'Výdaj smazán' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
