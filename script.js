let originalData = [];

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}
  function showMeaning(text) {
  alert(text);
}

window.onload = () => {
  // Recupera dati salvati
const savedData = localStorage.getItem("fatturazioneData");
if (savedData) {
  originalData = JSON.parse(savedData);
  populateUtenteFilter();
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
    populateUtenteFilter();
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
          // ordina subito
                originalData.sort((a, b) => {
                  const nomeA = (a.Descrizione || "").trim();
                  const nomeB = (b.Descrizione || "").trim();
                  return nomeA.localeCompare(nomeB, "it", { sensitivity: "base" }); // Confronta le stringhe in modo non case-insensitive quindi B == b e viene ordinato in modo corretto
                });
          saveData();
          populateUtenteFilter();
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
      const jsonData = XLSX.utils.sheet_to_json(sheet, {range: 1}); // Salta la prima riga

     // const headerRow = jsonData[0];
     // console.log("Header intero:", headerRow);

     //const intestazione = jsonData[0][18];
     //console.log("Intestazione colonna:", intestazione);
     
      originalData = jsonData; // già con header → oggetti tipo { Descrizione:..., Bday:..., Indirizzo:... }
      aggiornaMeseDaHeader(originalData);
      // ordina subito
            originalData.sort((a, b) => {
            const nomeA = (a.Descrizione || "").trim();
            const nomeB = (b.Descrizione || "").trim();
            return nomeA.localeCompare(nomeB, "it", { sensitivity: "base" }); // Confronta le stringhe in modo non case-insensitive quindi B == b e viene ordinato in modo corretto
          });
          //console.log(originalData.map(r => r.Descrizione));
      saveData();
      populateUtenteFilter();
      applyFilters();
      showPage('dati');
    };
    reader.readAsArrayBuffer(file);
  } 
  else {
    alert("Formato file non supportato. Usa CSV o XLSX.");
  }
}




  function aggiornaMeseDaHeader(data) {
  if (!data || data.length === 0) return;

  // Prendo le chiavi del primo oggetto (sono le intestazioni del file)
  const headers = Object.keys(data[0]);

  // Cerco la colonna che ha dentro una data tipo "01 lug 2025"
  const intestazione = headers.find(h => /^\d{2}\s[a-z]{3}\s\d{4}$/i.test(h));

  if (!intestazione) return;

  // es. "01 lug 2025" → "lug"
  const parts = intestazione.split(" ");
  const abbrev = (parts[1] || "-").toLowerCase();

  // Mappa mesi
  const mesiMap = {
    gen: "Gennaio",
    feb: "Febbraio",
    mar: "Marzo",
    apr: "Aprile",
    mag: "Maggio",
    giu: "Giugno",
    lug: "Luglio",
    ago: "Agosto",
    set: "Settembre",
    ott: "Ottobre",
    nov: "Novembre",
    dic: "Dicembre"
  };

  const meseCompleto = mesiMap[abbrev] || abbrev;

  // Seleziona l'ultima colonna dell'header della tabella
  const labelanteprimadati = document.getElementById("labelAnteprimaDati");
  labelanteprimadati.textContent = `Anteprima Dati - Mese: ${meseCompleto}`;

  const table = document.getElementById("mainTable");
  const thead = table.querySelector("thead");
  const ths = thead.querySelectorAll("th");
  // Aggiorna solo l'ultima colonna (Totale Ore Mese)
  ths[ths.length - 1].textContent = `TOTALE ORE MESE ${meseCompleto.toUpperCase()}`;
  console.log("Mese aggiornato:", meseCompleto);
  return meseCompleto;
}



 
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; 
  const date_info = new Date(utc_value * 1000);
  return date_info.toLocaleDateString("it-IT");
}


function populateTable(data) {
  const tableBody = document.getElementById("dataTable");
  tableBody.innerHTML = "";

  let totaleUtenti = 0;

  data.forEach(row => {
    // INSERIMENTO UTENTE
    const descrizione = row.Descrizione || "";
    if (!descrizione) return; // salta la riga vuota

    // INSERIMENTO DATA DI NASCITA
    const dataNascita = row.dataNascita || row["Data di Nascita Cliente"] || "";
      let dataFormattata = "";
    // CONTROLLO se la data è un numero seriale Excel o una stringa data valida
    // Se è un numero seriale Excel, convertilo in data JS
    if (dataNascita) {
      if (!isNaN(dataNascita) && Number(dataNascita) > 10000) {
        // È un numero seriale Excel
        dataFormattata = excelDateToJSDate(Number(dataNascita));
      } else if (!isNaN(Date.parse(dataNascita))) {
        // È una stringa data valida
        dataFormattata = new Date(dataNascita).toLocaleDateString("it-IT");
      }
    }
    // INSERIMENTO INIDIRIZZO
    const indirizzo = row.Indirizzo || row["Indirizzo Cliente"] || ""; 
    // INSERIMENTO CODICE FISCALE
    const codiceFiscale = row.CodiceFiscale || row["Codice Fiscale Cliente"] || "";
    // INSERIMENTO DA COLLONNA C-ADI FINO MINORI DISABILI GRAVI
    const assistenzaDomiciliareIntegrata = row["Assistenza Domiciliare Integrata"] || row["C-ADI"] || "";
    const anianoAutosuficente = row["Anziano Autosufficiente"] || row["C - Anziano autosufficiente"] || "";
    const anianoNonAutosuficente = row["Anziano Non Autosufficiente"] || row["C - Anziano non autosufficiente"] || "";
    const contrattiPrivati = row["Contratti Privati"] || row["C - Contratti privati"] || "";
    const disabile = row["Disabile"] || row["C - Disabile"] || "";
    const distrettoNord = row["Distretto Nord"] || row["C - DISTRETTO NORD"] || "";
    const distrettoSud = row["Distretto Sud"] || row["C - DISTRETTO SUD"] || "";
    const emergenzaCaldoASL = row["Emergenza Caldo ASL"] || row["C - EMERGENZA CALDO ASL"] || "";
    const emergenzaCaldoComune = row["Emergenza Caldo Comune"] || row["C - EMERGENZA CALDO COMUNE"] || "";
    const hcp = row["HCP"] || row["C - HCP"] || "";
    const minoriDisabiliGravi = row["Minori Disabili Gravi"] || row["C - Minori disabili gravi"] || "";
    // INSERIMENTO DA COLONNA NORD FINO VIA TESSO
    const nordOvest = row["Nord Ovest"] || row["C - Nord Ovest"] || "";
    const pnrr = row["PNRR"] || row["C - PNRR"] || "";
    const progettoSOD = row["Progetto SOD"] || row["C - Progetto SOD"] || "";
    const sudEst = row["Sud Est"] || row["C - Sud Est"] || "";
    const sudOvest = row["Sud Ovest"] || row["C - Sud Ovest"] || "";
    const ufficio = row["Ufficio"] || row["C - Ufficio"] || "";
    const viaTesso = row["C - UFFICIO VIA TESSO"] || "";
    // INSERIMENTO TOTALE ORE DEL MESE
    const totaleOre = row.totaleOre || row["Totale"] || "";

    const ore = parseFloat(row.Ore) || 0;
    const tariffa = parseFloat(row.Tariffa) || 0;
    const importo = ore * tariffa;
    totaleUtenti++;
    

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${descrizione}</td>
      <td>${dataFormattata}</td>
      <td>${indirizzo}</td>
      <td>${codiceFiscale}</td>
      <td>${assistenzaDomiciliareIntegrata ? parseFloat(assistenzaDomiciliareIntegrata).toFixed(2) : ""}</td>
      <td>${anianoAutosuficente ? parseFloat(anianoAutosuficente).toFixed(2) : ""}</td>
      <td>${anianoNonAutosuficente ? parseFloat(anianoNonAutosuficente).toFixed(2) : ""}</td>
      <td>${contrattiPrivati ? parseFloat(contrattiPrivati).toFixed(2) : ""}</td>
      <td>${disabile ? parseFloat(disabile).toFixed(2) : ""}</td>
      <td>${distrettoNord ? parseFloat(distrettoNord).toFixed(2) : ""}</td>
      <td>${distrettoSud ? parseFloat(distrettoSud).toFixed(2)  : ""}</td>
      <td>${emergenzaCaldoASL ? parseFloat(emergenzaCaldoASL).toFixed(2) : ""}</td>
      <td>${emergenzaCaldoComune ? parseFloat(emergenzaCaldoComune).toFixed(2) : ""}</td>
      <td>${hcp ? parseFloat(hcp).toFixed(2) : ""}</td>
      <td>${minoriDisabiliGravi ? parseFloat(minoriDisabiliGravi).toFixed(2) : ""}</td>
      <td>${nordOvest ? parseFloat(nordOvest).toFixed(2) : ""}</td>
      <td>${pnrr ? parseFloat(pnrr).toFixed(2) : ""}</td>
      <td>${progettoSOD ? parseFloat(progettoSOD).toFixed(2) : ""}</td>
      <td>${sudEst ? parseFloat(sudEst).toFixed(2) : ""}</td>
      <td>${sudOvest ? parseFloat(sudOvest).toFixed(2) : ""}</td>
      <td>${ufficio ? parseFloat(ufficio).toFixed(2) : ""}</td>
      <td>${totaleOre.toFixed(2)}</td>
    `;
    tableBody.appendChild(tr);
    
  });

  const totaleUtentiElement = document.getElementById("totaleUtenti");
  if(totaleUtentiElement){
    totaleUtentiElement.textContent = 'Totale Utenti: ' + totaleUtenti
  }
}

// Filtro dati per Utente

function applyFilters() {
  const utenteValue = document.getElementById("UtenteFilter").value;
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  const filtered = originalData.filter(row => {
    const matchesUtente = !utenteValue || row.Descrizione === utenteValue;
    const matchesSearch = (row.Descrizione || "").toLowerCase().includes(searchValue);
    return matchesUtente && matchesSearch;
  });

  populateTable(filtered);
}

function populateUtenteFilter() {
  const select = document.getElementById("UtenteFilter");
  select.innerHTML = '<option value="">Tutti</option>';
  const utente = [...new Set(originalData.map(row => row.Descrizione))].filter(Boolean);
  utente.forEach(ben => {
    const option = document.createElement("option");
    option.value = ben;
    option.textContent = ben;
    select.appendChild(option);
  });
}

function exportPDF() {
  const { jsPDF } = window.jspdf;

  // Crea il PDF in orizzontale
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Titolo del report
  doc.setFontSize(14);
  doc.text("Report Fatturazione", 14, 10);

  // Genera la tabella da HTML
  doc.autoTable({
    html: '#mainTable',       // id della tabella
    startY: 20,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak', // testo lungo va a capo
      valign: 'middle',
      halign: 'center'
    },
    headStyles: {
      fillColor: [33, 37, 41], // header scuro
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    showHead: 'everyPage', // header ripetuto su ogni pagina
    bodyStyles: {
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 30 }, // UTENTE
      1: { cellWidth: 25 }, // DATA DI NASCITA
      2: { cellWidth: 40 }, // INDIRIZZO
      3: { cellWidth: 30 }  // CODICE FISCALE
      // altre colonne auto
    },
    tableWidth: 'auto',
    showHead: 'everyPage', // ✅ header ripetuto su ogni pagina
    margin: { top: 20 }    // spazio per il titolo
  });

  // Salva PDF
  doc.save("fatturazione.pdf");
}

function exportExcel() {
  const table = document.getElementById("dataTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Fatturazione" });
  XLSX.writeFile(wb, "fatturazione.xlsx");
}