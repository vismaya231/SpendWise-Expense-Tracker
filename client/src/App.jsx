
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/transactions";
const SUMMARY_URL = "http://localhost:5000/api/summary";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  });

  const [form, setForm] = useState({
    title: "",
    type: "expense",
    category: "Food",
    amount: "",
    date: getTodayDate()
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch transactions and dashboard summary
  const fetchData = async () => {
    try {
      const [transactionResponse, summaryResponse] =
        await Promise.all([
          fetch(API_URL),
          fetch(SUMMARY_URL)
        ]);

      if (!transactionResponse.ok || !summaryResponse.ok) {
        throw new Error("Unable to load dashboard data");
      }

      const transactionData = await transactionResponse.json();
      const summaryData = await summaryResponse.json();

      setTransactions(transactionData);
      setSummary(summaryData);
    } catch (error) {
      setMessage("Unable to connect to server. Please check the backend.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Add transaction
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.category.trim() ||
        !form.amount || !form.date) {
      setMessage("Please fill in all fields.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Please enter a valid positive amount.");
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const selectedDate = new Date(form.date + "T00:00:00.000Z");

if (
  !datePattern.test(form.date) ||
  Number.isNaN(selectedDate.getTime()) ||
  selectedDate.toISOString().slice(0, 10) !== form.date
) {
  setMessage("Please enter a valid date.");
  return;
}

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add transaction");
      }

      setForm({
        title: "",
        type: "expense",
        category: "Food",
        amount: "",
        date: getTodayDate()
      });

      setMessage("Transaction added successfully!");
      await fetchData();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete transaction");
      }

      setMessage("Transaction deleted successfully!");
      await fetchData();

    } catch (error) {
      setMessage(error.message);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>SpendWise 💜</h1>
          <p>Manage your money, track your progress.</p>
        </div>
        <div className="header-tag">Personal Finance Dashboard</div>
      </header>

      <main className="container">

        {/* Dashboard Summary */}
        <section className="summary-grid">

          <div className="summary-card income-card">
            <span className="card-icon">💰</span>
            <p>Total Income</p>
            <h2>{formatCurrency(summary.totalIncome)}</h2>
          </div>

          <div className="summary-card expense-card">
            <span className="card-icon">🛍️</span>
            <p>Total Expenses</p>
            <h2>{formatCurrency(summary.totalExpenses)}</h2>
          </div>

          <div className="summary-card savings-card">
            <span className="card-icon">✨</span>
            <p>Net Savings</p>
            <h2>{formatCurrency(summary.netSavings)}</h2>
          </div>

        </section>

        {/* Transaction Form */}
        <section className="content-card">
          <h2>➕ Add New Transaction</h2>
          <p className="section-description">
            Record your income and expenses here.
          </p>

          <form onSubmit={handleSubmit} className="transaction-form">

            <div className="form-group">
              <label>Transaction Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Monthly Salary"
                value={form.title}
                onChange={handleChange}
                maxLength="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Transaction Type</label>
              <select
                name="type"
                value={form.type}
                onChange={(e) => {
                  setForm({
                    ...form,
                    type: e.target.value,
                    category: e.target.value === "income"
                      ? "Salary"
                      : "Food"
                  });
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {form.type === "income" ? (
                  <>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Business">Business</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Education">Education</option>
                    <option value="Bills">Bills</option>
                    <option value="Health">Health</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="add-button"
              disabled={loading}
            >
              {loading ? "Adding..." : "+ Add Transaction"}
            </button>

          </form>

          {message && (
            <div className="message" role="status">
              {message}
            </div>
          )}
        </section>

        {/* Transaction History */}
        <section className="content-card history-card">
          <div className="history-heading">
            <div>
              <h2>📋 Transaction History</h2>
              <p className="section-description">
                View and manage all your transactions.
              </p>
            </div>
            <span className="transaction-count">
              {transactions.length} Records
            </span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No transactions yet. Add your first transaction!
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.title}</td>
                      <td>
                        <span className="category-badge">
                          {transaction.category}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className={transaction.type}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          <p>SpendWise © 2026 | Track Smart. Save Better. 💜</p>
        </footer>

      </main>
    </div>
  );
}

export default App;
