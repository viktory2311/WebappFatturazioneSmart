let csvData = [];

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function loadCSV() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Seleziona un file CSV prima di procedere.");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      csvData = results.data;
      populateTable(csvData);
      showPage('dati');
    }
  });
}

function populateTable(data) {
  const tableBody = document.getElementById("dataTable");
  tableBody.innerHTML = "";

  data.forEach(row => {
    const beneficiario = row.Beneficiario || "";
    const ore = parseFloat(row.Ore) || 0;
    const tariffa = parseFloat(row.Tariffa) || 0;
    const importo = ore * tariffa;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${beneficiario}</td>
      <td>${ore}</td>
      <td>${tariffa}</td>
      <td>${importo.toFixed(2)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// Filtro dati per beneficiario
document.getElementById("searchInput").addEventListener("keyup", function() {
  const searchValue = this.value.toLowerCase();
  const filtered = csvData.filter(row => 
    (row.Beneficiario || "").toLowerCase().includes(searchValue)
  );
  populateTable(filtered);
});
