// Elementi
const scrollTopBtn = document.getElementById('scrollTopBtn');
const tableScrollTopBtn = document.getElementById('tableScrollTopBtn');
const tableWrapper = document.getElementById('tableWrapper');

// Soglie
const PAGE_SHOW_SCROLL_Y = 300;   // mostra il pulsante pagina dopo 300px
const WRAPPER_SHOW_SCROLL_Y = 80; // mostra il pulsante wrapper dopo 80px

/* --- Pulsante pagina: mostra/nascondi in base allo scroll della finestra --- */
window.addEventListener('scroll', () => {
  if (window.scrollY > PAGE_SHOW_SCROLL_Y) {
    scrollTopBtn.style.display = 'flex';
  } else {
    scrollTopBtn.style.display = 'none';
  }
});

/* click: scrolla in cima alla pagina (smooth) */
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Tastiera: invio o spazio attiva il bottone quando ha focus */
scrollTopBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    scrollTopBtn.click();
  }
});

/* --- Pulsante per il wrapper/tabella (scroll interno) --- */
// Se non hai wrapper, tableWrapper potrebbe essere null — protezione:
if (tableWrapper) {
  // ascolta lo scroll del wrapper
  tableWrapper.addEventListener('scroll', () => {
    if (tableWrapper.scrollTop > WRAPPER_SHOW_SCROLL_Y) {
      tableScrollTopBtn.style.display = 'block';
    } else {
      tableScrollTopBtn.style.display = 'none';
    }
  });

  // mostra il pulsante anche al focus con tastiera (accessibilità)
  tableWrapper.addEventListener('focus', () => {
    if (tableWrapper.scrollTop > 0) tableScrollTopBtn.style.display = 'block';
  });
  tableWrapper.addEventListener('blur', () => {
    // non nascondere immediatamente, lasciare comportamento naturale
  });

  // click: porta wrapper in cima
  tableScrollTopBtn.addEventListener('click', () => {
    tableWrapper.scrollTo({ top: 0, behavior: 'smooth' });
    tableWrapper.focus(); // focus per accessibilità
  });

  // keyboard support
  tableScrollTopBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tableScrollTopBtn.click();
    }
  });
}

/* --- Optional: mostra il pulsante wrapper anche se il contenuto è inferiore all'altezza ma la pagina ha molti elementi --- */
/* Se vuoi che il pulsante del wrapper sia sempre visibile quando ci sono molte righe nel tbody,
   puoi abilitare il controllo sulla lunghezza del tbody: */
function checkTableLengthAndMaybeShow() {
  const tbody = document.querySelector('#bigTable tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr').length;
  // se ci sono più di N righe, mostra il bottone wrapper (anche se non scrolled)
  const SHOW_IF_ROWS_MORE_THAN = 15;
  if (rows > SHOW_IF_ROWS_MORE_THAN) {
    tableScrollTopBtn.style.display = 'block';
  }
}
// chiamalo dopo il popolamento tabella
checkTableLengthAndMaybeShow();
