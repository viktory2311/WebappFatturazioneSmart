let originalData = [];

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

window.onload = () => {
  // Recupera dati salvati
const savedData = localStorage.getItem("fatturazioneData");
if (savedData) {
  originalData = JSON.parse(savedData);
  populateBeneficiarioFilter();
  applyFilters();
}

// Elementi DOM
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const dropMessage = document.getElementById('drop-message');

// Evidenzia area quando si trascina sopra
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('bg-primary', 'text-white');
    dropMessage.textContent = "Rilascia il file qui!";
  });
});

// Rimuovi evidenziazione quando si esce
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('bg-primary', 'text-white');
    dropMessage.innerHTML = 'Trascina qui il file CSV/XLSX oppure <span class="text-primary fw-bold">clicca per selezionare</span>';
  });
});

// Gestisci il drop
dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    loadFile(); // Avvia subito la lettura del file
  }
});

// Permetti click per aprire il file picker
dropArea.addEventListener('click', () => fileInput.click());

// Avvia caricamento quando viene selezionato un file
fileInput.addEventListener('change', loadFile);
    
};

function saveData() {
  localStorage.setItem("fatturazioneData", JSON.stringify(originalData));
}
function resetData() {
  if (confirm("Sei sicuro di voler cancellare tutti i dati?")) {
    localStorage.removeItem("fatturazioneData");
    originalData = [];
    populateBeneficiarioFilter();
    applyFilters();
  }
}

function loadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Seleziona un file CSV o XLSX prima di procedere.");
    return;
  }

  const reader = new FileReader();

    // LA FUNZIONE Papa.parse è utilizzata per leggere il file CSV
  // e popolare la tabella con i dati.
  // Assicurati di avere la libreria PapaParse inclusa nel tuo progetto
  // ed è asincrona, quindi non blocca l'interfaccia utente durante il caricamento.

  if (file.name.toLowerCase().endsWith(".csv")) {
    reader.onload = function(e) {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          originalData = results.data;
          saveData();
          populateBeneficiarioFilter();
          applyFilters();
          showPage('dati');
        }
      });
    };
    reader.readAsText(file);
  } 
  else if (file.name.toLowerCase().endsWith(".xlsx")) {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      originalData = jsonData; // già con header → oggetti tipo { Beneficiario:..., Ore:..., Tariffa:... }
      saveData();
      populateBeneficiarioFilter();
      applyFilters();
      showPage('dati');
    };
    reader.readAsArrayBuffer(file);
  } 
  else {
    alert("Formato file non supportato. Usa CSV o XLSX.");
  }
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

function applyFilters() {
  const beneficiarioValue = document.getElementById("beneficiarioFilter").value;
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  const filtered = originalData.filter(row => {
    const matchesBeneficiario = !beneficiarioValue || row.Beneficiario === beneficiarioValue;
    const matchesSearch = (row.Beneficiario || "").toLowerCase().includes(searchValue);
    return matchesBeneficiario && matchesSearch;
  });

  populateTable(filtered);
}


function populateBeneficiarioFilter() {
  const select = document.getElementById("beneficiarioFilter");
  select.innerHTML = '<option value="">Tutti</option>';
  const beneficiari = [...new Set(originalData.map(row => row.Beneficiario))].filter(Boolean);
  beneficiari.forEach(ben => {
    const option = document.createElement("option");
    option.value = ben;
    option.textContent = ben;
    select.appendChild(option);
  });
}
