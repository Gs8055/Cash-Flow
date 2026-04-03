let salary = 0;
let expenses = [];
let currentCurrency = "INR";
let exchangeRates = { INR: 1 };
let chart;

window.onload = async function () {
    await fetchRates();

    const savedData = JSON.parse(localStorage.getItem("cashflow"));

    if (savedData) {
        salary = savedData.salary;
        expenses = savedData.expenses;
    }

    updateUI();
};

async function fetchRates() {
    try {
        const res = await fetch("https://api.frankfurter.app/latest?from=INR");
        const data = await res.json();

        exchangeRates = {
            INR: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR
        };
    } catch (err) {
        console.log("API Error", err);
    }
}

function saveData() {
    localStorage.setItem("cashflow", JSON.stringify({ salary, expenses }));
}

function setSalary() {
    const input = document.getElementById("salaryInput").value;

    if (input <= 0) return alert("Enter valid salary");

    salary = Number(input);
    saveData();
    updateUI();
}

function addExpense() {
    const name = document.getElementById("expenseName").value;
    const amount = document.getElementById("expenseAmount").value;

    if (!name || amount <= 0) {
        return alert("Invalid input");
    }

    expenses.push({ name, amount: Number(amount) });

    saveData();
    updateUI();
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveData();
    updateUI();
}

function convertCurrency() {
    currentCurrency = document.getElementById("currency").value;
    updateUI();
}

function convert(value) {
    return (value * exchangeRates[currentCurrency]).toFixed(2);
}

function updateUI() {
    let totalExpense = expenses.reduce((acc, item) => acc + item.amount, 0);
    let balance = salary - totalExpense;

    document.getElementById("salary").innerText = convert(salary);
    document.getElementById("totalExpense").innerText = convert(totalExpense);
    document.getElementById("balance").innerText = convert(balance);

    let balanceText = document.getElementById("balanceText");
    if (balance < salary * 0.1 && salary > 0) {
        balanceText.style.color = "red";
    } else {
        balanceText.style.color = "black";
    }

    let list = document.getElementById("expenseList");
    list.innerHTML = "";

    expenses.forEach((item, index) => {
        let li = document.createElement("li");
        li.innerHTML = `
            ${item.name} - ${convert(item.amount)}
            <button onclick="deleteExpense(${index})">🗑</button>
        `;
        list.appendChild(li);
    });

    updateChart(totalExpense, balance);
}

function updateChart(expense, balance) {
    const ctx = document.getElementById("myChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Expenses", "Balance"],
            datasets: [{
                data: [expense, balance]
            }]
        }
    });
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    doc.text("Cash Flow Report", 10, y);
    y += 10;

    doc.text(`Salary: ${salary}`, 10, y);
    y += 10;

    let totalExpense = 0;

    expenses.forEach((item, i) => {
        doc.text(`${i + 1}. ${item.name} - ${item.amount}`, 10, y);
        totalExpense += item.amount;
        y += 10;
    });

    let balance = salary - totalExpense;

    y += 10;
    doc.text(`Total Expense: ${totalExpense}`, 10, y);
    y += 10;
    doc.text(`Remaining Balance: ${balance}`, 10, y);

    doc.save("cashflow_report.pdf");
}