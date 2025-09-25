let originalData = [];

/* FUNZIONE PER SCEGLIERE LA CORRETTA PAGINA DA MOSTRARE */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

//Gestione navigazione tra pagine
function setActive(button, page) {
    // Rimuove active da tutti i pulsanti
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Aggiunge active al pulsante cliccato
    button.classList.add('active');
    // Mostra la pagina selezionata
    showPage(page);
}


/* GESTIONE CARICAMENTO DATI INIZIALI */
window.onload = () => { 
            // Recupera dati salvati
            //const savedData = localStorage.getItem("fatturazioneData");
            //if (savedData) {
            //originalData = JSON.parse(savedData);
            //populateUtenteFilter();
            //applyFilters();
            //}
          caricaTariffe();      

          // ---- Qui inseriamo il fetch dai server ----
            fetch("/utenti/")
              .then(res => {
                if (!res.ok) throw new Error("Errore HTTP: " + res.status);
                return res.json();
              })
              .then(data => {
                                console.log("Dati ricevuti dal server:", data);

                                // 🔄 Mappo i campi dal formato DB → formato frontend (uguale a CSV/XLSX)
                                originalData = data.map(u => ({
                                  "Descrizione": u.nome,
                                  "Data di Nascita Cliente": formatDateIfValid(u.data_nascita),
                                  "Indirizzo Cliente": u.indirizzo,
                                  "Codice Fiscale Cliente": u.codice_fiscale,

                                  // Colonne da C-ADI fino Minori Disabili Gravi
                                  "Assistenza Domiciliare Integrata": u.assistenza_domiciliare_integrata,
                                  "Anziano Autosufficiente": u.anziano_autosufficiente,
                                  "Anziano Non Autosufficiente": u.anziano_non_autosufficiente,
                                  "Contratti Privati": u.contratti_privati,
                                  "Disabile": u.disabile,
                                  "Distretto Nord": u.distretto_nord,
                                  "Distretto Sud": u.distretto_sud,
                                  "Emergenza Caldo ASL": u.emergenza_caldo_asl,
                                  "Emergenza Caldo Comune": u.emergenza_caldo_comune,
                                  "HCP": u.hcp,
                                  "Minori Disabili Gravi": u.minori_disabili_gravi,

                                  // Colonne da Nord Ovest fino Via Tesso
                                  "Nord Ovest": u.nord_ovest,
                                  "PNRR": u.pnrr,
                                  "Progetto SOD": u.progetto_sod,
                                  "Sud Est": u.sud_est,
                                  "Sud Ovest": u.sud_ovest,
                                  "Ufficio": u.ufficio,
                                  "C - UFFICIO VIA TESSO": u.via_tesso,
                                  "Data": u.data_riferimento,
                                  "tipologia": u.tipologia,   // <-- aggiungi
                                  "apl": u.apl,     // <-- aggiungi
                                  "oretotmese":u.oretotmese,
                                  "buonoservizio":u.buonoservizio,
                                  "tariffa": u.tariffa,
                                  "Totale": u.totale_ore
                                }));
                                if (originalData.length > 1) {
                                        const righeDaOrdinare = originalData.slice(0, -1);
                                        righeDaOrdinare.sort((a, b) => (a.Descrizione||"").trim().localeCompare((b.Descrizione||"").trim(), "it", {sensitivity: "base"}));
                                        originalData = [...righeDaOrdinare, originalData[originalData.length - 1]];
                                      }                                
                              /*originalData.forEach((u, i) => {
                                if (!u["Data di Nascita Cliente"]) {
                                  console.log(`❌ Vuota in posizione ${i}`, data[i]); // dati originali
                                } else {
                                  console.log(`✅ Data ok in posizione ${i}:`, u["Data di Nascita Cliente"]);
                                }   
                              });*/

                              aggiornaUIconData(originalData);
                              populateTable(originalData);
                              populateUtenteFilter();
                            })
            .catch(err => console.error("Errore caricamento utenti:", err));
            // ------------------------------------------
            // Setup per tutti i drop area
            setupDropArea('fileInput-oss', 'oss');
            setupDropArea('fileInput-umana', 'umana');
            setupDropArea('fileInput-synergie', 'synergie');
            setupDropArea('fileInput-gigroup', 'gigroup');

}
function setupDropArea(fileInputId, source) {
    const dropArea = document.getElementById(fileInputId).parentElement;
    const fileInput = document.getElementById(fileInputId);
    const dropMessage = dropArea.querySelector('div');

    // Evidenziazione drag
    ['dragenter','dragover'].forEach(evt => {
        dropArea.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.add('bg-primary', 'text-white');
        });
    });

    ['dragleave','drop'].forEach(evt => {
        dropArea.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.remove('bg-primary', 'text-white');
        });
    });

    // Drop file
    dropArea.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateDropMessage(fileInput, dropMessage); // mostra nome file
            const conferma = confirm(`Vuoi caricare il file "${fileInput.files[0].name}"?`);
            if (conferma) loadFile(source);
        }
    });

    // Click per aprire file picker
    dropArea.addEventListener('click', () => fileInput.click());

    // Selezione manuale
    fileInput.addEventListener('change', () => {
        updateDropMessage(fileInput, dropMessage);
        const conferma = confirm(`Vuoi caricare il file "${fileInput.files[0].name}"?`);
        if (conferma) loadFile(source);
    });
}


/* FUNZIONI UTILIZZATE PER GESTIRE IL CARICAMENTO INIZIALE */
function formatDateIfValid(dateString) {
  if (!dateString) return "--";              // niente data => placeholder
  const d = new Date(dateString);
  if (isNaN(d)) return "--";                  // data non valida => placeholder
  return d.toLocaleDateString("en-EN");      // data valida => formato ITA
}
function updateDropMessage(fileInput, dropMessage) {
  if (fileInput.files.length > 0) {
    dropMessage.textContent = `File selezionato: ${fileInput.files[0].name}`;
  } else {
    dropMessage.innerHTML = 'Trascina qui il file CSV/XLSX oppure <span class="text-primary fw-bold">clicca per selezionare</span>';
  }
}
/*--- FINE ---*/



/* GESTIONE CARICAMENTO FILE EXCEL */
function loadFile(source) {
  if (!source) {
    alert("Errore: tipo file non specificato");
    return;
  }

  const fileInput = document.getElementById(`fileInput-${source}`);
  if (!fileInput) {
    alert("Errore: input file non trovato per " + source);
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    alert("Seleziona un file CSV o XLSX prima di procedere.");
    return;
  }

  const reader = new FileReader();

  if (file.name.toLowerCase().endsWith(".csv")) {
    reader.onload = function(e) {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          processData(results.data, source);
        }
      });
    };
    reader.readAsText(file);
  } 
  else if (file.name.toLowerCase().endsWith(".xlsx")) {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];

      let jsonData;
      if(source === "oss"){
          jsonData = XLSX.utils.sheet_to_json(sheet, { range: 1 });
      console.log("Aggiunto file oss 😂");
      }else if(source === "synergie"){
          let sheetName = workbook.SheetNames[1];
          let sheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(sheet, { range: 5 });
      console.log("Aggiunto file synergie 😂");
      }else{
          jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }
      console.log("✅ File letto:", file.name);
      console.log("📦 Dati estratti:", jsonData.slice(0, 2));
      if(source ==="umana"){console.log("SI");}
      console.log("🔁 Passaggio a processData con source:", source);
      processData(jsonData, source);
    };
    reader.readAsArrayBuffer(file);
  } 
  else {
    alert("Formato file non supportato. Usa CSV o XLSX.");
  }
}
/*--- FINE ---*/
// DICHIARAZIONE GLOBALE, FUORI DA QUALSIASI FUNZIONE
let allData = [];
let ossData = [];
let visualizedData =[];
// Funzione che processa i dati a seconda della fonte
async function processData(data, source) {
  console.log("😁😁 Valore di Source: ",source);
  try {    
    if (source === "oss") {
      let ossData = data.map(row => ({
        ...row,
        tipologia: "OSS",
        apl: deriveAPL(source),
        buonoservizio: row["BUONO SERVIZIO"] || 0,

      }));
      aggiornaMeseDaHeader(ossData);

      const res = await fetch("/salva/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ossData)
      });
      const savedData = await res.json();
      console.log("✅ Dati OSS salvati:", savedData);

      let utentiRes = await fetch("/utenti/");
      let utentiData = await utentiRes.json();

      // Mappo dati DB → frontend
      originalData = utentiData.map(u => ({
        "Descrizione": u.nome,
        "Data di Nascita Cliente": formatDateIfValid(u.data_nascita),
        "Indirizzo Cliente": u.indirizzo,
        "Codice Fiscale Cliente": u.codice_fiscale,
        "Assistenza Domiciliare Integrata": u.assistenza_domiciliare_integrata,
        "Anziano Autosufficiente": u.anziano_autosufficiente,
        "Anziano Non Autosufficiente": u.anziano_non_autosufficiente,
        "Contratti Privati": u.contratti_privati,
        "Disabile": u.disabile,
        "Distretto Nord": u.distretto_nord,
        "Distretto Sud": u.distretto_sud,
        "Emergenza Caldo ASL": u.emergenza_caldo_asl,
        "Emergenza Caldo Comune": u.emergenza_caldo_comune,
        "HCP": u.hcp,
        "Minori Disabili Gravi": u.minori_disabili_gravi,
        "Nord Ovest": u.nord_ovest,
        "PNRR": u.pnrr,
        "Progetto SOD": u.progetto_sod,
        "Sud Est": u.sud_est,
        "Sud Ovest": u.sud_ovest,
        "Ufficio": u.ufficio,
        "C - UFFICIO VIA TESSO": u.via_tesso,
        "Data": u.data_riferimento,
        "tipologia": u.tipologia,
        "apl": u.apl,
        "oretotmese":u.oretotmese,
        "buonoservizio":u.buonoservizio,
        "tariffa": u.tariffa,
        "Totale": u.totale_ore
      }))
      
       if (originalData.length > 1) {
        const righeDaOrdinare = originalData.slice(0, -1);
        righeDaOrdinare.sort((a, b) => (a.Descrizione||"").trim().localeCompare((b.Descrizione||"").trim(), "it", {sensitivity: "base"}));
        originalData = [...righeDaOrdinare, originalData[originalData.length - 1]];
      }
      populateTable(originalData);
      populateUtenteFilter();
      
      if (confirm("Hai caricato il file OSS. Vuoi aprire la pagina dati ora o aggiungere altri file?")) {
        showPage('dati');
      }

    } else if (source === "gigroup") {
      const dataWithSource = data.map(row => ({
        ...row,
        descrizione: row["Ragione sociale"] || "",
        Fonte: source,
        apl: deriveAPL(source),
        tipologia: row["TIPOLOGIA"] || "",
        distretto: row["Distretto"] || "Non specificato",
        oretotmese: row["ORE ENTE"] || "",
        buonoservizio: row["BUONO SERVIZIO"] || 0,
        tariffa: row["TARIFFA"] || 0,
        indirizzo: row["Descrizione circoscrizione"] || "",
        codice_fiscale: row["CODICE FISCALE"] || "",
        descrizionetipologia: row["Descrizione tipologia"] || "",

      }));

      allData = [...allData, ...dataWithSource];

      const minimalData = dataWithSource.map(row => ({
        descrizione: row["Ragione sociale"] || "",
        tipologia: row.tipologia || row["TIPOLOGIA"] || "",
        apl: row.apl || "",
        distretto: row["Distretto"] || "Non specificato",
        oretotmese: row["ORE ENTE"] || 0,
        buonoservizio: row["BUONO SERVIZIO"] || 0,
        tariffa: row["TARIFFA"] || 0,
        "Indirizzo Cliente": row["Descrizione circoscrizione"] || "",
        "Codice Fiscale Cliente": row["CODICE FISCALE"] || "",
      }));

      console.log("📤 Invio al server solo tipologia e apl:", minimalData.slice(0, 5));
      
      // Salva i dati e poi carica utenti aggiornati
      await fetch("/salva/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minimalData)
      });

      let utentiRes = await fetch("/utenti/");
      let utentiData = await utentiRes.json();

      // Mappo dati DB → frontend
      originalData = utentiData.map(u => ({
        "Descrizione": u.nome,
        "Data di Nascita Cliente": formatDateIfValid(u.data_nascita),
        "Indirizzo Cliente": u.indirizzo,
        "Codice Fiscale Cliente": u.codice_fiscale,
        "Assistenza Domiciliare Integrata": u.assistenza_domiciliare_integrata,
        "Anziano Autosufficiente": u.anziano_autosufficiente,
        "Anziano Non Autosufficiente": u.anziano_non_autosufficiente,
        "Contratti Privati": u.contratti_privati,
        "Disabile": u.disabile,
        "Distretto Nord": u.distretto_nord,
        "Distretto Sud": u.distretto_sud,
        "Emergenza Caldo ASL": u.emergenza_caldo_asl,
        "Emergenza Caldo Comune": u.emergenza_caldo_comune,
        "HCP": u.hcp,
        "Minori Disabili Gravi": u.minori_disabili_gravi,
        "Nord Ovest": u.nord_ovest,
        "PNRR": u.pnrr,
        "Progetto SOD": u.progetto_sod,
        "Sud Est": u.sud_est,
        "Sud Ovest": u.sud_ovest,
        "Ufficio": u.ufficio,
        "C - UFFICIO VIA TESSO": u.via_tesso,
        "Data": u.data_riferimento,
        "tipologia": u.tipologia,
        "apl": u.apl,
        "oretotmese":u.oretotmese,
        "buonoservizio":u.buonoservizio,
        "tariffa": u.tariffa,
        "Totale": u.totale_ore,
        "descrizionetipologia": u.descrizionetipologia
      }))
      
       if (originalData.length > 1) {
        const righeDaOrdinare = originalData.slice(0, -1);
        righeDaOrdinare.sort((a, b) => (a.Descrizione||"").trim().localeCompare((b.Descrizione||"").trim(), "it", {sensitivity: "base"}));
        originalData = [...righeDaOrdinare, originalData[originalData.length - 1]];
      }
      console.log("🧪 Primo record dopo mapping:", originalData[0]);
      populateTable(originalData);
      populateUtenteFilter();

      if (confirm(`Hai caricato il file ${source}. Vuoi aprire la pagina dati ora?`)) {
        showPage('dati');
      }
    }else if (source === "synergie") {
 const dataWithSource = data.map(row => ({
        ...row,
        descrizione: row["FIRMATARIO"] || " ",
        Fonte: source,
        apl: deriveAPL(source),
        tipologia: "AF",
        distretto: row["CIRCOSCRIZIONE"] || "Non specificato",
        oretotmese: row["ORE_LAV_MESE"] || "",
        buonoservizio: row["ORE IN BUONO"] || 0,
        "Indirizzo Cliente": row["Descrizione circoscrizione"] || "",
        "Codice Fiscale Cliente": row["CODICE FISCALE BENEFICIARIO"] || "",
        "Data di Nascita Cliente": formatDateIfValid(row["DATA NASCITA BENEFICIARIO"]),
      }));
      console.log("✅ Dati Synergie processati:", dataWithSource.slice(0, 2));
      allData = [...allData, ...dataWithSource];

      const minimalData = dataWithSource.map(row => ({
        descrizione: row["FIRMATARIO"] || " ",
        Fonte: source,
        apl: deriveAPL(source),
        tipologia: "AF",
        distretto: row["CIRC."] || "Non specificato",
        oretotmese: row["ORE_LAV_MESE"] || "",
        buonoservizio: row["ORE IN BUONO"] || 0,
        "Indirizzo Cliente": row["Descrizione circoscrizione"] || "",
        "Codice Fiscale Cliente": row["COD. FISCALE BENEFICIARIO"] || "",
        "Data di Nascita Cliente": row["DATA NASCITA BENEFICIARIO"],
      }));

      //console.log("📤 Invio al server solo tipologia e apl:", minimalData.slice(0, 5));
      
      // Salva i dati e poi carica utenti aggiornati
      await fetch("/salva/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minimalData)
      });

      let utentiRes = await fetch("/utenti/");
      let utentiData = await utentiRes.json();

      // Mappo dati DB → frontend
      originalData = utentiData.map(u => ({
        "Descrizione": u.nome,
        "Data di Nascita Cliente": formatDateIfValid(u.data_nascita),
        "Indirizzo Cliente": u.indirizzo,
        "Codice Fiscale Cliente": u.codice_fiscale,
        "Assistenza Domiciliare Integrata": u.assistenza_domiciliare_integrata,
        "Anziano Autosufficiente": u.anziano_autosufficiente,
        "Anziano Non Autosufficiente": u.anziano_non_autosufficiente,
        "Contratti Privati": u.contratti_privati,
        "Disabile": u.disabile,
        "Distretto Nord": u.distretto_nord,
        "Distretto Sud": u.distretto_sud,
        "Emergenza Caldo ASL": u.emergenza_caldo_asl,
        "Emergenza Caldo Comune": u.emergenza_caldo_comune,
        "HCP": u.hcp,
        "Minori Disabili Gravi": u.minori_disabili_gravi,
        "Nord Ovest": u.nord_ovest,
        "PNRR": u.pnrr,
        "Progetto SOD": u.progetto_sod,
        "Sud Est": u.sud_est,
        "Sud Ovest": u.sud_ovest,
        "Ufficio": u.ufficio,
        "C - UFFICIO VIA TESSO": u.via_tesso,
        "Data": u.data_riferimento,
        "tipologia": u.tipologia,
        "apl": u.apl,
        "oretotmese":u.oretotmese,
        "buonoservizio":u.buonoservizio,
        "tariffa": u.tariffa,
        "Totale": u.totale_ore
      }))
      
       if (originalData.length > 1) {
        const righeDaOrdinare = originalData.slice(0, -1);
        righeDaOrdinare.sort((a, b) => (a.Descrizione||"").trim().localeCompare((b.Descrizione||"").trim(), "it", {sensitivity: "base"}));
        originalData = [...righeDaOrdinare, originalData[originalData.length - 1]];
      }
      console.log("🧪 Primo record dopo mapping:", originalData[0]);
      populateTable(originalData);
      populateUtenteFilter();

      if (confirm(`Hai caricato il file ${source}. Vuoi aprire la pagina dati ora?`)) {
        showPage('dati');
      }      
    }else if (source === "umana") {
      console.log("📝 Dati ricevuti per Umana:", data);
        const dataWithSource = data.map(row => ({
        ...row,
        descrizione: row["Ragione sociale"] || " ",
        Fonte: source,
        apl: deriveAPL(source),
        tipologia: "AF",
        distretto: row["CIRCOSCRIZIONE"] || "Non specificato",
        oretotmese: row["Ore_Lav_Mese"] || "",
        buonoservizio: row["Ore_Inbuono"] || 0,
        "Codice Fiscale Cliente": row["Codice Fiscale"] || "",
      }));
      console.log("✅ Dati Umana processati:", dataWithSource);
      allData = [...allData, ...dataWithSource];

      const minimalData = dataWithSource.map(row => ({
        descrizione: row["Ragione sociale"] || "Non specificato",
        Fonte: source,
        apl: deriveAPL(source),
        tipologia: "AF",
        distretto: row["CIRCOSCRIZIONE"] || "Non specificato",
        oretotmese: row["Ore_Lav_Mese"] || "",
        buonoservizio: row["Ore_Inbuono"] || 0,
        "Codice Fiscale Cliente": row["Codice Fiscale"] || "",
      }));

      //console.log("📤 Invio al server solo tipologia e apl:", minimalData.slice(0, 5));
      
      // Salva i dati e poi carica utenti aggiornati
      await fetch("/salva/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minimalData)
      });

      let utentiRes = await fetch("/utenti/");
      let utentiData = await utentiRes.json();

      // Mappo dati DB → frontend
      originalData = utentiData.map(u => ({
        "Descrizione": u.nome,
        "Data di Nascita Cliente": formatDateIfValid(u.data_nascita),
        "Indirizzo Cliente": u.indirizzo,
        "Codice Fiscale Cliente": u.codice_fiscale,
        "Assistenza Domiciliare Integrata": u.assistenza_domiciliare_integrata,
        "Anziano Autosufficiente": u.anziano_autosufficiente,
        "Anziano Non Autosufficiente": u.anziano_non_autosufficiente,
        "Contratti Privati": u.contratti_privati,
        "Disabile": u.disabile,
        "Distretto Nord": u.distretto_nord,
        "Distretto Sud": u.distretto_sud,
        "Emergenza Caldo ASL": u.emergenza_caldo_asl,
        "Emergenza Caldo Comune": u.emergenza_caldo_comune,
        "HCP": u.hcp,
        "Minori Disabili Gravi": u.minori_disabili_gravi,
        "Nord Ovest": u.nord_ovest,
        "PNRR": u.pnrr,
        "Progetto SOD": u.progetto_sod,
        "Sud Est": u.sud_est,
        "Sud Ovest": u.sud_ovest,
        "Ufficio": u.ufficio,
        "C - UFFICIO VIA TESSO": u.via_tesso,
        "Data": u.data_riferimento,
        "tipologia": u.tipologia,
        "apl": u.apl,
        "oretotmese":u.oretotmese,
        "buonoservizio":u.buonoservizio,
        "tariffa": u.tariffa,
        "Totale": u.totale_ore
      }))
      
       if (originalData.length > 1) {
        const righeDaOrdinare = originalData.slice(0, -1);
        righeDaOrdinare.sort((a, b) => (a.Descrizione||"").trim().localeCompare((b.Descrizione||"").trim(), "it", {sensitivity: "base"}));
        originalData = [...righeDaOrdinare, originalData[originalData.length - 1]];
      }
      console.log("🧪 Primo record dopo mapping:", originalData[0]);
      populateTable(originalData);
      populateUtenteFilter();

      if (confirm(`Hai caricato il file ${source}. Vuoi aprire la pagina dati ora?`)) {
        showPage('dati');
      }      
    }

  } catch (err) {
    console.error("❌ Errore nel caricamento/salvataggio:", err);
  }
}

//Funzione per gestire APL Source
function deriveAPL(source) {
  const s = source.toLowerCase();
  if (s.includes("gigroup")) return "gigroup";
  if (s.includes("umana")) return "umana";
  if (s.includes("synergie")) return "synergie";
  // aggiungi qui le altre sorgenti in futuro
  return "";
}

/* GESTIONE VISUALIZZAZIONE MESE CORRENTE GESTITO FRONTEND*/
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
    gen: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    mag: "05",
    giu: "06",
    lug: "07",
    ago: "08",
    set: "09",
    ott: "10",
    nov: "11",
    dic: "12"
  };

  // Converto il mese in numero e formatto la data come "YYYY-MM-DD"
  const mese = mesiMap[abbrev] || "00"; // Se non trovo il mese, metto "00"
  const anno = parts[2] || "0000"; // L'anno

  // Costruisco la data finale in formato "YYYY-MM-DD"
  const dataFormattata = `${anno}-${mese}-01`; // Assume sempre il giorno "01"

  // Aggiungo la data al mio oggetto (ad ogni record)
  data.forEach(item => {
    item.data = dataFormattata;  // Aggiunge la data formattata a ciascun record
  });

const mesiMapCompleto = {
    "01": "Gennaio", 
    "02": "Febbraio", 
    "03": "Marzo", 
    "04": "Aprile", 
    "05": "Maggio", 
    "06": "Giugno",
    "07": "Luglio", 
    "08": "Agosto", 
    "09": "Settembre", 
    "10": "Ottobre",
    "11": "Novembre", 
    "12": "Dicembre"
  };

  const meseCompleto = mesiMapCompleto[mese] || mese;
  // aggiorna UI
  document.getElementById("labelAnteprimaDati").textContent =
    `Anteprima Dati - Mese: ${meseCompleto}`;

  const ths = document.querySelectorAll("#mainTable thead th");
  if (ths.length > 0) {
    ths[ths.length - 1].textContent =
      `TOTALE ORE MESE ${meseCompleto.toUpperCase()}`;
  }

  console.log("Mese aggiornato:", meseCompleto);
  return meseCompleto;
}
/*--- FINE ---*/



/* GESTIONE VISUALIZZAZIONE MESE CORRENTE GESTITO BACKEND*/
function aggiornaUIconData(data) {

  if (!data || data.length === 0) return;


  // prendo la data dal primo record
  const dataStr = data[1].Data; // dipende da come l’hai chiamato
  if (!dataStr) return;

  const [anno, mese] = dataStr.split("-"); // es. "2025-07-01" → ["2025","07","01"]

  const mesiMap = {
    "01": "Gennaio", 
    "02": "Febbraio", 
    "03": "Marzo", 
    "04": "Aprile", 
    "05": "Maggio", 
    "06": "Giugno",
    "07": "Luglio", 
    "08": "Agosto", 
    "09": "Settembre", 
    "10": "Ottobre",
    "11": "Novembre", 
    "12": "Dicembre"
  };

  const meseCompleto = mesiMap[mese] || mese;
  // aggiorna UI
    document.getElementById("labelAnteprimaDati").textContent =
    `Anteprima Dati - Mese: ${meseCompleto}`;

  const ths = document.querySelectorAll("#mainTable thead th");
  if (ths.length > 0) {
    ths[ths.length - 1].textContent =
      `TOTALE ORE MESE ${meseCompleto.toUpperCase()}`;
  }

    //console.log("Mese aggiornato da DB:", meseCompleto);
  return meseCompleto;
}
/*--- FINE ---*/





 

/* GESTIONE POPOLAZIONE TABELLA */
function populateTable(data) {
  const tableBody = document.getElementById("dataTable");
  console.log("📥 Popolamento tabella con", data.length, "righe");

   
      tableBody.innerHTML = "";
      visualizedData = [];  // Resetta i dati visualizzati solo se non stai facendo append
    
    
  let totaleUtenti = 0;
      //console.log("Dati in populateTable:", data.slice(0, 3)); // Log dei primi 2 record per verificaù
      console.log("Dati in populateTable:", data);
  data.forEach(row => {
    // INSERIMENTO UTENTE
    const descrizione = row.Descrizione || row.nome || "";
    //if (!descrizione) return; // salta la riga vuota

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
    const anzianoAutosuficente = row["Anziano Autosufficiente"] || row["C - Anziano autosufficiente"] || "";
    const anzianoNonAutosuficente = row["Anziano Non Autosufficiente"] || row["C - Anziano non autosufficiente"] || "";
    const contrattiPrivati = row["Contratti Privati"] || row["C - Contratti privati"] || "";
    const disabile = row["Disabile"] || row["C - Disabile"] || "";
    const distrettoNord = row["Distretto Nord"] || row["C - DISTRETTO NORD"] || "0.00";
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

    const tipologia = row.tipologia || row["TIPOLOGIA"] || ""; 
    const apl = row.apl || "";
    const tariffa = row.tariffa || "1.11";
    //console.log("Stampa di Tariffa 🌿:",tariffa);
    const oreTotMese = row.oretotmese || row["ORE_LAV_MESE"] || "";
    //console.log("Stampa di Ore TOTALI 🌿:",row.oreTotMese);
    //console.log("Stampa di APL 🌿:",row.apl);

    // INSERIMENTO TOTALE ORE DEL MESE
    const totaleOre =  Number(row.totaleOre || row["Totale"]|| row.oretotmese || "");
    const totaleFormattato = totaleOre.toFixed(2);

    const ore = parseFloat(row.Ore) || 0;
    //const tariffa = parseFloat(row.Tariffa) || 0;
    const importo = ore * tariffa;
    totaleUtenti++;
    
    // Aggiungi la riga ai dati visualizzati
      visualizedData.push({
        descrizione,
        dataNascita: dataFormattata,
        indirizzo,
        codiceFiscale,
        assistenzaDomiciliareIntegrata: assistenzaDomiciliareIntegrata ? parseFloat(assistenzaDomiciliareIntegrata).toFixed(2) : "0.00",
        anzianoAutosuficente: anzianoAutosuficente ? parseFloat(anzianoAutosuficente).toFixed(2) : "0.00",
        anzianoNonAutosuficente: anzianoNonAutosuficente ? parseFloat(anzianoNonAutosuficente).toFixed(2) : "0.00",
        contrattiPrivati: contrattiPrivati ? parseFloat(contrattiPrivati).toFixed(2) : "0.00",
        disabile: disabile ? parseFloat(disabile).toFixed(2) : "0.00",
        distrettoNord: distrettoNord ? parseFloat(distrettoNord).toFixed(2) : "0.00",
        distrettoSud: distrettoSud ? parseFloat(distrettoSud).toFixed(2) : "0.00",
        emergenzaCaldoASL: emergenzaCaldoASL ? parseFloat(emergenzaCaldoASL).toFixed(2) : "0.00",
        emergenzaCaldoComune: emergenzaCaldoComune ? parseFloat(emergenzaCaldoComune).toFixed(2) : "0.00",
        hcp: hcp ? parseFloat(hcp).toFixed(2) : "0.00",
        minoriDisabiliGravi: minoriDisabiliGravi ? parseFloat(minoriDisabiliGravi).toFixed(2) : "0.00",
        nordOvest: nordOvest ? parseFloat(nordOvest).toFixed(2) : "0.00",
        pnrr: pnrr ? parseFloat(pnrr).toFixed(2) : "0.00",
        progettoSOD: progettoSOD ? parseFloat(progettoSOD).toFixed(2) : "0.00",
        sudEst: sudEst ? parseFloat(sudEst).toFixed(2) : "0.00",
        sudOvest: sudOvest ? parseFloat(sudOvest).toFixed(2) : "0.00",
        ufficio: ufficio ? parseFloat(ufficio).toFixed(2) : "0.00",
        apl: row.apl ?? "Valore non disponibile",
        tipologia: row.tipologia ?? "Valore non disponibile",
        buonoservizio: row.buonoservizio,
        tariffa: row.tariffa,
        totaleFormattato,
        descrizionetipologia: row.descrizionetipologia,
      });
      //console.log("📦 Contenuto visualizedData[0]-in populatetable:", visualizedData[2]);
    //console.log(`▶ Riga in rendering: descrizione=${descrizione}, tipologia=${tipologia}, apl=${apl}`);
/*console.log("Riga elaborata prima del tr:", {
  descrizione,
  tipologia: row.tipologia || row["TIPOLOGIA"],
  apl: row.APL
});*/
//console.log(`▶ Riga in rendering: descrizione=${descrizione}, tipologia=${tipologia}, apl=${apl}`);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${descrizione}</td>
      <td>${dataFormattata}</td>
      <td>${indirizzo}</td>
      <td>${codiceFiscale}</td>
      <td>${assistenzaDomiciliareIntegrata ? parseFloat(assistenzaDomiciliareIntegrata).toFixed(2) : "0.00"}</td>
      <td>${anzianoAutosuficente ? parseFloat(anzianoAutosuficente).toFixed(2) : "0.00"}</td>
      <td>${anzianoNonAutosuficente ? parseFloat(anzianoNonAutosuficente).toFixed(2) : "0.00"}</td>
      <td>${contrattiPrivati ? parseFloat(contrattiPrivati).toFixed(2) : "0.00"}</td>
      <td>${disabile ? parseFloat(disabile).toFixed(2) : "0.00"}</td>
      <td>${distrettoNord ? parseFloat(distrettoNord).toFixed(2) : "0.00"}</td>
      <td>${distrettoSud ? parseFloat(distrettoSud).toFixed(2)  : "0.00"}</td>
      <td>${emergenzaCaldoASL ? parseFloat(emergenzaCaldoASL).toFixed(2) : "0.00"}</td>
      <td>${emergenzaCaldoComune ? parseFloat(emergenzaCaldoComune).toFixed(2) : "0.00"}</td>
      <td>${hcp ? parseFloat(hcp).toFixed(2) : "0.00"}</td>
      <td>${minoriDisabiliGravi ? parseFloat(minoriDisabiliGravi).toFixed(2) : "0.00"}</td>
      <td>${nordOvest ? parseFloat(nordOvest).toFixed(2) : "0.00"}</td>
      <td>${pnrr ? parseFloat(pnrr).toFixed(2) : "0.00"}</td>
      <td>${progettoSOD ? parseFloat(progettoSOD).toFixed(2) : "0.00"}</td>
      <td>${sudEst ? parseFloat(sudEst).toFixed(2) : "0.00"}</td>
      <td>${sudOvest ? parseFloat(sudOvest).toFixed(2) : "0.00"}</td>
      <td>${ufficio ? parseFloat(ufficio).toFixed(2) : "0.00"}</td>
      <td>${tipologia}</td>
      <td>${apl}</td>
      <td>${totaleOre.toFixed(2)}</td>
    `;
    tableBody.appendChild(tr);
    
  });

  const totaleUtentiElement = document.getElementById("totaleUtenti");
  if(totaleUtentiElement){
    totaleUtentiElement.textContent = 'Totale Utenti: ' + totaleUtenti
  }
}
/* FUNZIONI USATE PER GESTIONE POPOLAZIONE TABELLA */
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; 
  const date_info = new Date(utc_value * 1000);
  return date_info.toLocaleDateString("it-IT");
}
/*--- FINE ---*/

/* GESTIONI FILTRI DA APPLICARE */
function applyFilters() {

  const utenteValue = document.getElementById("UtenteFilter").value;
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const filterCheckboxadi = document.getElementById("filterCheckboxadi").checked;
  const filterCheckboxhcp = document.getElementById("filterCheckboxhcp").checked;
  const tipoAnziano = document.getElementById("filtertipoAnziano").value;
  const selectDistretto = document.getElementById("filterDistretto").value;

  const filterCheckboxgigroup = document.getElementById("filterCheckboxgigroup").checked;  
  const filterCheckboxsynergie = document.getElementById("filterCheckboxsynergie").checked; 
  const filterCheckboxumana = document.getElementById("filterCheckboxumana").checked; 

  let matchesFonte = true; // default: passa il filtro


  const filtered = originalData.filter(row => {

  //console.log("Riga corrente Fonte:", row.apl, row);
  if (filterCheckboxgigroup) {
        matchesFonte = row.apl === "gigroup";
    } else if (filterCheckboxsynergie) {
        matchesFonte = row.apl === "synergie";
    } else if (filterCheckboxumana) {
        matchesFonte = row.apl === "umana";
    }

  const matchesUtente = !utenteValue || row.Descrizione === utenteValue;
  const matchesSearch = (row.Descrizione || "").toLowerCase().includes(searchValue);

  const colonnaadiValue = row["Assistenza Domiciliare Integrata"] || row["C-ADI"] || 0;
  const matchesCheckbox = !filterCheckboxadi || colonnaadiValue > 0;

  const colonnahcpValue = row["HCP"] || row["C - HCP"] || 0;
  const matchesCheckboxHCP = !filterCheckboxhcp || colonnahcpValue > 0;

  // Filtro tipo anziano
  let matchesTipoAnziano = true; // Default: passa il filtro
  if (tipoAnziano === "autosufficiente") {
    const valore = parseFloat(row["Anziano Autosufficiente"] || 0);
          //console.log("Test Autosufficiente:", valore);

    matchesTipoAnziano = valore > 0; // passa se > 0
  } else if (tipoAnziano === "non_autosufficiente") {
    const valore = parseFloat(row["Anziano Non Autosufficiente"] || 0);
          //console.log("Test Non Autosufficiente:", valore);

    matchesTipoAnziano = valore > 0; // passa se > 0
  }

  // Filtro tipo distretto
  let matchesDitretto = true; // Default: passa il filtro
  if (selectDistretto === "nord") {
    const valore = parseFloat(row["Distretto Nord"] || 0);
          //console.log("Test Autosufficiente:", valore);

    matchesDitretto = valore > 0; // passa se > 0
  } else if (selectDistretto === "nord_ovest") {
    const valore = parseFloat(row["Nord Ovest"] || 0);
          //console.log("Test Non Autosufficiente:", valore);

    matchesDitretto = valore > 0; // passa se > 0
  } else if (selectDistretto === "sud") {
    const valore = parseFloat(row["Distretto Sud"] || 0);
          //console.log("Test Non Autosufficiente:", valore);

    matchesDitretto = valore > 0; // passa se > 0
  } else if (selectDistretto === "sud_ovest") {
    const valore = parseFloat(row["Sud Ovest"] || 0);
          //console.log("Test Non Autosufficiente:", valore);

    matchesDitretto = valore > 0; // passa se > 0
  } else if (selectDistretto === "sud_est") {
    const valore = parseFloat(row["Sud Est"] || 0);
          //console.log("Test Non Autosufficiente:", valore);

    matchesDitretto = valore > 0; // passa se > 0
  }   
    //console.log("Riga completa:", row);
  return matchesUtente && matchesSearch && matchesCheckbox && matchesCheckboxHCP && matchesTipoAnziano && matchesDitretto && matchesFonte;
  });
console.log("Dati filtrati:", filtered.slice(0, 3));

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

  const select_tipo_anziano = document.getElementById("filtertipoAnziano");
  select_tipo_anziano.innerHTML = `
  <option value="">Tutti</option>
  <option value="autosufficiente">Autosufficiente</option>
  <option value="non_autosufficiente">Non Autosufficiente</option>
`;
const select_distretto = document.getElementById("filterDistretto");
select_distretto.innerHTML = `
  <option value="">Tutti</option>
  <option value="nord">Distretto NORD</option>
  <option value="nord_ovest">Distretto NORD-OVEST</option>
  <option value="sud">Distretto SUD</option>
  <option value="sud_ovest">Distretto SUD-OVEST</option>
  <option value="sud_est">Distretto SUD-EST</option>
`;
}
/*--- FINE GESTIONE FILTRI DA APPLICARE ---*/










/* ESPORTAZIONE IN FOMATO EXCEL */
async function exportExcel() {
  if (!visualizedData || visualizedData.length === 0) {
    alert("Nessun dato da esportare!");
    return;
  }
  //console.log("📦 Contenuto visualizedData:", visualizedData);

  /***  Ricavo il mese dal campo Data (YYYY-MM-DD)***/
  let meseCompleto = "ND";
  try {
    meseCompleto = aggiornaUIconData(originalData); // la funzione che già usi PER CALCOLARE LA DATA
    if (meseCompleto == undefined) meseCompleto = aggiornaMeseDaHeader(originalData);
  } catch (e) {
    console.warn("Impossibile ricavare mese, uso ND");
  }

  // Crea workbook
  const workbook = new ExcelJS.Workbook();

  // Crea il foglio per il distretto nord e sud
  const nordWorksheet = workbook.addWorksheet("Distretto Nord");
  const sudWorksheet = workbook.addWorksheet("Distretto Sud");

  // Definisci le colonne per ogni tipo di fattura
  let headers = [];
  switch (tipoFattura) {
    case 'anziani_non_autosufficenti':
      headers = ["Descrizione", "Data di Nascita", "Codice Fiscale Cliente", "Buono_TipoUtenza", "Mese", "Tipo_Intervento", "Intervento_OreMensili", "Intervento_CostoMensile", "Quantità erogata", "Totale", "Apl", "Distretto"];
      break;
    case 'anziani_autosufficenti':
      headers = ["Nome e cognome", "Data di Nascita", "Codice Fiscale Cliente", "Distretto", "Buono_TipoUtenza", "Mese", "Tipo_Intervento", "Intervento_OreMensili", "Intervento_CostoMensile", "Quantità erogata", "Totale", "Apl"];
      break;
    case 'disabili':
      headers = ["Nome e cognome", "Data di Nascita", "Codice Fiscale Cliente", "Distretto", "Buono_TipoUtenza", "Mese", "Tipo_Intervento", "Intervento_OreMensili", "Intervento_CostoMensile", "Quantità erogata", "Totale", "Apl"];
      break;
    case 'minori_disabili_gravi':
      headers = ["Nome e cognome", "Data di Nascita", "Codice Fiscale Cliente", "Distretto", "Buono_TipoUtenza", "Mese", "Tipo_Intervento", "Intervento_OreMensili", "Intervento_CostoMensile", "Quantità erogata", "Totale", "Apl"];
      break;
    case 'emergenza_caldo':
      headers = ["Descrizione", "Data di Nascita", "Emergenza Caldo", "Assistenza", "Distretto"];
      break;
    default:
      headers = ["Descrizione", "Data di Nascita", "Indirizzo", "Codice Fiscale", "Distretto"];
      break;
  }

  const interventoCostoMensileIndex = headers.indexOf("Intervento_CostoMensile") + 1;

  // Aggiungi la riga per il mese (e il distretto) per entrambi i fogli
  const rowMeseNord = nordWorksheet.addRow([`Mese: ${meseCompleto}`]);
  nordWorksheet.mergeCells(1, 1, 1, headers.length); // Unisci le celle per il mese
  rowMeseNord.height = 30;
  rowMeseNord.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "48C765" } };
    cell.font = { bold: true, color: { argb: "000000" }, size: 20 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  nordWorksheet.addRow(headers);
  const headerRowNord = nordWorksheet.getRow(2);
  headerRowNord.eachCell((cell, colNumber) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "48C765" } };
    cell.font = { bold: true, color: { argb: "000000" } };
    
    // Centra solo le colonne dalla seconda in poi (indice 2)
    if (colNumber > 1) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  const rowMeseSud = sudWorksheet.addRow([`Mese: ${meseCompleto}`]);
  sudWorksheet.mergeCells(1, 1, 1, headers.length); // Unisci le celle per il mese
  rowMeseSud.height = 30;
  rowMeseSud.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } };
    cell.font = { bold: true, color: { argb: "000000" }, size: 20 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  sudWorksheet.addRow(headers);
  const headerRowSud = sudWorksheet.getRow(2);
  headerRowSud.eachCell((cell, colNumber) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD700" } };
    cell.font = { bold: true, color: { argb: "000000" } };
    
    // Centra solo le colonne dalla seconda in poi (indice 2)
    if (colNumber > 1) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });
  // --- Inserisci i dati per il Distretto Nord e Sud --- 
  //console.log("📦 Contenuto visualizedData prima del ciclo:", visualizedData[2]);
  visualizedData.forEach(row => {
    let dataRow = [];

    //console.log("➡️ Chiavi della riga:", Object.keys(row)); // Mostra tutte le proprietà
    //console.log("✅ APL:", row.apl, "TIPOLOGIA:", row.tipologia); // Mostra i valori

    const distrettoNord = row.distrettoNord || "0.00";
    const distrettoSud = row.distrettoSud || "0.00";
    const nordOvest = row.nordOvest || "0.00";
    const sudEst = row.sudEst || "0.00";
    const sudOvest = row.sudOvest || "0.00";

    // Aggiungere "Anziani non autosufficenti" per il tipo di fattura "anziani_non_autosufficenti, cosa simile per gli altri file"
    let tipoUtenza ="";
    console.log("🙌Valore Descrizione Tipologia  ==> ", row.descrizionetipologia);
    if(row.anzianoAutosuficente > 0)
    {
      tipoUtenza = "anziani_autosufficenti";
    }else if(row.anzianoNonAutosuficente > 0){
      tipoUtenza = "anziani_non_autosufficienti";
    }else if(row.minoriDisabiliGravi > 0){
      tipoUtenza = "minori_disabili_gravi";
    }else if(row.disabile > 0){
      tipoUtenza = "disabile";
    }

    /*switch (tipoFattura) {
      case 'anziani_non_autosufficenti':  tipoUtenza = "anziani_non_autosufficenti"; break;
      case 'anziani_autosufficenti':  tipoUtenza = "anziani_autosufficenti"; break;
      case 'disabili':  tipoUtenza = "disabili"; break;
      case 'minori_disabili_gravi':  tipoUtenza = "minori_disabili_gravi"; break;
      case 'emergenza_caldo':  tipoUtenza = "emergenza_caldo"; break;
       default: tipoUtenza = "Non Specificato"; break;

    }*/

    // Verifica a quale distretto appartiene la riga
    const isNord = distrettoNord !== "0.00" || nordOvest !== "0.00"; // Include il Nord se uno dei distretti Nord è valorizzato
    const isSud = distrettoSud !== "0.00" || sudEst !== "0.00" || sudOvest !== "0.00"; // Include il Sud se uno dei distretti Sud è valorizzato

  let tipologiaValue = row.tipologia;

    let print_distretto = "";  // Variabile per il nome del distretto

    // Se il distretto è legato a Nord
    if (isNord) {
      if (distrettoNord > 0) {
        print_distretto = "Nord";  // Assegna il nome del distretto
      } else if (nordOvest > 0) {
        print_distretto = "Nord Ovest";  // Assegna il nome del distretto Nord Ovest
      }
    }

    // Se il distretto è legato a Sud
    else if (isSud) {
      if (distrettoSud > 0) {
        print_distretto = "Sud";  // Assegna il nome del distretto Sud
      } else if (sudEst > 0) {
        print_distretto = "Sud Est";  // Assegna il nome del distretto Sud Est
      } else if (sudOvest > 0) {
        print_distretto = "Sud Ovest";  // Assegna il nome del distretto Sud Ovest
      }
    }
    let  totaleFatturato = "€ " + parseFloat(row.tariffa * row.totaleFormattato).toFixed(2);
            

    // Definisci la riga di dati in base al tipo di fattura
    switch (tipoFattura) {
      case 'anziani_non_autosufficenti':
        // Verifica solo se apl è vuoto o null if (aplValue === " " || aplValue === null || aplValue === undefined) { aplValue = 'Valore non disponibile'; } 
        console.log("APL Value prima di dettaglio:", row.apl);  // Verifica che il valore sia corretto
        row.tariffa = parseFloat(row.tariffa || 0).toFixed(2).replace('.', ',');
        row.totaleFormattato = row.totaleFormattato.replace('.', ',');
        totaleFatturato = totaleFatturato.replace('.', ',');
        //console.log("Ore Buono Servizio ==> ",  row.buonoservizio);
        /*totaleFatturato --> Totale calcolato come Tariffa * Totale Ore
          row.totaleFormattato --> Totale Ore Erogate
          row.tariffa --> Tariffa oraria(Costo Mensile)
          row.buonoservizio --> Tipo Intervento*/
        dataRow = [row.descrizione, row.dataNascita, row.codiceFiscale, tipoUtenza, meseCompleto, tipologiaValue, row.buonoservizio, row.tariffa, row.totaleFormattato, totaleFatturato, row.apl, print_distretto]; 
        //console.log("Data Row in dettaglio(Dopo):", dataRow);  // Verifica che i dati siano corretti

   break;
      case 'anziani_autosufficenti':
        row.tariffa = parseFloat(row.tariffa || 0).toFixed(2).replace('.', ',');
        row.totaleFormattato = row.totaleFormattato.replace('.', ',');
        totaleFatturato = totaleFatturato.replace('.', ',');
        dataRow = [row.descrizione, row.dataNascita, row.codiceFiscale, print_distretto, tipoUtenza, meseCompleto, tipologiaValue, row.buonoservizio, row.tariffa, row.totaleFormattato, totaleFatturato, row.apl];
        break;
      case 'disabili':
        row.tariffa = parseFloat(row.tariffa || 0).toFixed(2).replace('.', ',');
        row.totaleFormattato = row.totaleFormattato.replace('.', ',');
        totaleFatturato = totaleFatturato.replace('.', ',');
        dataRow = [row.descrizione, row.dataNascita, row.codiceFiscale, print_distretto, tipoUtenza, meseCompleto, tipologiaValue, row.buonoservizio, row.tariffa, row.totaleFormattato, totaleFatturato, row.apl];
        break;
      case 'minori_disabili_gravi':
        row.tariffa = parseFloat(row.tariffa || 0).toFixed(2).replace('.', ',');
        row.totaleFormattato = row.totaleFormattato.replace('.', ',');
        totaleFatturato = totaleFatturato.replace('.', ',');
        dataRow = [row.descrizione, row.dataNascita, row.codiceFiscale, print_distretto, tipoUtenza, meseCompleto, tipologiaValue, row.buonoservizio, row.tariffa, row.totaleFormattato, totaleFatturato, row.apl];
        break;
      case 'emergenza_caldo':
        dataRow = [row.descrizione, row.dataNascita, "Test 1", "Test 2", print_distretto];
        break;
      default:
        dataRow = [row.descrizione, row.dataNascita, row.indirizzo, row.codiceFiscale, print_distretto];
        break;
    }


  let count = 0;
    if (isNord) {
      const row = nordWorksheet.addRow(dataRow);

        if (nordWorksheet.rowCount % 2 === 0) {
                // Se il numero della riga è pari, la riga sarà verde
                row.eachCell((cell) => {
                  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "B0FFB6" } }; // Verde
                });
              } else {
                // Se il numero della riga è dispari, la riga sarà bianca
                row.eachCell((cell) => {
                  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } }; // Bianco
                });
              }

      //console.log("📈 Riga aggiunta a Nord:", row.values); // Controlla i valori della riga aggiunta
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
           if (colNumber === interventoCostoMensileIndex) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "C6EFCE" },
              };
            }
            /*if(count%2 == 0){
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "00FF00" } }; // Verde
                    count ++;
            }else{
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } }; // Bianco
                    count++;
            }*/
            cell.font = {
              color: { argb: "000000" },
            };
            cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } }
              };
      });
    } else if (isSud) {
      const row = sudWorksheet.addRow(dataRow);
      //console.log("📈 Riga aggiunta a Sud:", row.values); // Controlla i valori della riga aggiunta
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
            if (colNumber === interventoCostoMensileIndex) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "C6EFCE" },
              };
            }
              cell.font = {
                color: { argb: "000000" },
              };
              cell.border = {
                  top: { style: 'thin', color: { argb: '000000' } },
                  left: { style: 'thin', color: { argb: '000000' } },
                  bottom: { style: 'thin', color: { argb: '000000' } },
                  right: { style: 'thin', color: { argb: '000000' } }
                };
      });
    }
  });


// --- Costruisci la tabella riassuntiva ---
let riepilogo = {};  // { key: { descrizione, costoOrario, ore, totale, fattura } }

visualizedData.forEach(row => {
  let key = row.tipologia + "|" + (row.apl || "") + "|" + (row.fattura_numero || "");
  if (!riepilogo[key]) {
    riepilogo[key] = {
      descrizione: `ore ${row.tipologia.toLowerCase()} ${row.apl || ""}`.trim(),
      costoOrario: parseFloat(row.tariffa) || 0,
      ore: 0,
      totale: 0,
      fattura: row.fattura_numero || ""
    };
  }
  riepilogo[key].ore += parseFloat(row.totaleFormattato) || 0;
  riepilogo[key].totale += (parseFloat(row.totaleFormattato) || 0) * (parseFloat(row.tariffa) || 0);
});

// --- Inserisci nel foglio Nord ---
nordWorksheet.addRow([]);
nordWorksheet.addRow(["Descrizione", "costo orario", "ore", "totale", "fattura n."]).eachCell(cell => {
  cell.font = { bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD700" } };
});

Object.values(riepilogo).forEach(item => {
  let row = nordWorksheet.addRow([
    item.descrizione,
    "€ " + item.costoOrario.toFixed(2).replace(".", ","),
    item.ore.toFixed(2).replace(".", ","),
    "€ " + item.totale.toFixed(2).replace(".", ","),
    item.fattura
  ]);
  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });
});

// --- Copia anche sul foglio Sud ---
sudWorksheet.addRow([]);
sudWorksheet.addRow(["Descrizione", "costo orario", "ore", "totale", "fattura n."]).eachCell(cell => {
  cell.font = { bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD700" } };
});

Object.values(riepilogo).forEach(item => {
  let row = sudWorksheet.addRow([
    item.descrizione,
    "€ " + item.costoOrario.toFixed(2).replace(",", "."),
    item.ore.toFixed(2).replace(",", "."),
    "€ " + item.totale.toFixed(2).replace(",", "."),
    item.fattura
  ]);
  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });
});

  

  // --- Larghezza delle colonne ---
  nordWorksheet.columns = headers.map(h => {
    if (h.toLowerCase().includes("nome") || h.toLowerCase().includes("descrizione")) {
      return { key: h, width: 50 };
    } else if (h.toLowerCase().includes("indirizzo") || h.toLowerCase().includes("codice fiscale")) {
      return { key: h, width: 50 };
    } else {
      return { key: h, width: 25 };
    }
  });

  sudWorksheet.columns = nordWorksheet.columns;

  // --- Esportazione ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `fatturazione_${tipoFattura}_${meseCompleto}.xlsx`;
  link.click();
}



/*--- FINE ---*/

function caricaTariffe() {
  fetch(`/tariffe/?_=${Date.now()}`)  // cache-buster
    .then(r => r.json())
    .then(data => {
      data.forEach(t => {
        let cell = document.querySelector(`#tabella-prezzi td[data-prestazione="${t.tipologia}"][data-apl="${t.apl || ""}"`);

        if (cell) cell.innerText = parseFloat(t.valore).toFixed(2).replace(",", ".");
      });
    })
    .catch(err => console.error("Errore caricando tariffe:", err));
}

// Salva le tariffe modificate
function salvaTariffe() {
  let dati = {};
  document.querySelectorAll("#tabella-prezzi td[data-prestazione]").forEach(cell => {
    dati[cell.dataset.prestazione] = parseFloat(cell.innerText.trim());
  });

  fetch("/tariffe/salva/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dati)
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === "ok") {
      alert("✅ Prezzi salvati su server!");
      location.reload();
    } else {
      alert("❌ Errore: " + res.message);
    }
  });
}


function salvaTariffe() {
  let dati = [];
  document.querySelectorAll("#tabella-prezzi td[data-prestazione]").forEach(cell => {
    let prestazione = cell.dataset.prestazione;
    let apl = cell.dataset.apl || "";
    let valore = parseFloat(cell.innerText.trim());

    if (!isNaN(valore)) {
      dati.push({
        prestazione: prestazione,
        apl: apl,
        valore: valore
      });
    }
  });

  fetch("/tariffe/salva/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dati })
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === "ok") {
      alert("✅ Prezzi salvati su server!");
      location.reload();
    } else {
      alert("❌ Errore: " + res.message);
    }
  });
}


function validateNumberInput(cell){
let text = cell.innerText.trim().replace('.', ','); 
let num = parseFloat(text);
if (isNaN(num) || num < 0 || num > 1000) {
    alert("❌ Inserisci un valore tra 0 e 1000");
    cell.innerText = "0.00";
  } else {
    cell.innerText = num.toFixed(2);
  }
}



  function showMeaning(text) {
  alert(text);
}

function resetData() {
  if (confirm("Sei sicuro di voler cancellare tutti i dati?")) {
    fetch("reset/", { method: "POST", headers: {"Content-Type": "application/json"} })
    .then(response => response.json())
    .then(data => {
      if(data.Status === "ok"){
          alert("Dati resettati con successo.");
      originalData = [];
      populateUtenteFilter();
      applyFilters();
      }else{
        alert("Errore nel res i dati.");
      }
    
  })
  .catch(error => {
    console.error("Errore nel resettare i dati:", error);
    alert("Errore nel resett i dati.");
  })
}
}
// SERVER A SALVARE I DATI IN LOCALE
function saveData() {
  localStorage.setItem("fatturazioneData", JSON.stringify(originalData));
}

let tipoFattura = ''; // Variabile globale che tiene traccia del tipo di fattura selezionato
function setFattura(tipo) {
  tipoFattura = tipo;  // Imposta il tipo di fattura in base al bottone cliccato

  // Aggiorna la descrizione in base al tipo di fattura selezionato
  let description = '';
  switch (tipo) {
    case 'anziani_non_autosufficenti':
      description = '<strong>Questa fattura includerà:</strong><br> Una pagina per il DISTRETTO NORD e una Pagina per il DISTRETTO SUD.';
      break;
    case 'anziani_autosufficenti':
      description = '<strong>Questa fattura includerà:</strong><br> Tutti i distretti';
      break;
    case 'disabili':
      description = '<strong>Questa fattura includerà:</strong><br> Una pagina per il DISTRETTO NORD e una Pagina per il DISTRETTO SUD.';
      break;
    case 'minori_disabili_gravi':
      description = '<strong>Questa fattura includerà:</strong><br> Una pagina per il DISTRETTO NORD e una Pagina per il DISTRETTO SUD.';
      break;
    case 'emergenza_caldo':
      description = '<strong>Questa fattura includerà:</strong><br> Una pagina per il DISTRETTO NORD e una Pagina per il DISTRETTO SUD.';
      break; 
    default:
      description = 'Seleziona un tipo di fattura per vedere i parametri.';
  }

  // Aggiorna la sezione della descrizione
  document.getElementById('fattura-description').innerHTML = description;
}
