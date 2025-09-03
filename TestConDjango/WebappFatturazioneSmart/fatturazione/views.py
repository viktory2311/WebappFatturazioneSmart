from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import logging
from .models import Utente
from datetime import datetime, timedelta
from django.shortcuts import render
import re

# Configura logger
logger = logging.getLogger(__name__)

def excel_serial_to_date(serial):
    if isinstance(serial, (int, float)):
        return datetime(1899, 12, 30) + timedelta(days=serial)
    return None

def estrai_data_da_header(header):
    """Funzione per estrarre data in formato 'YYYY-MM-DD' da una colonna di intestazione"""
    # Usando regex per trovare una data nel formato "01 lug 2025"
    match = re.match(r'(\d{2})\s([a-z]{3})\s(\d{4})', header, re.IGNORECASE)
    if match:
        giorno = match.group(1)
        mese_abbrev = match.group(2).lower()
        anno = match.group(3)

        # Mappa dei mesi abbreviati a numeri
        mesi_map = {
            "gen": "01", "feb": "02", "mar": "03", "apr": "04", "mag": "05",
            "giu": "06", "lug": "07", "ago": "08", "set": "09", "ott": "10",
            "nov": "11", "dic": "12"
        }

        mese = mesi_map.get(mese_abbrev, "00")  # Se non trova il mese, imposta "00"
        return f"{anno}-{mese}-01"  # Ritorna la data come 'YYYY-MM-DD'
    return None  # Se non è una data valida, ritorna None

@csrf_exempt
def salva_dati(request):
    if request.method != "POST":
        return JsonResponse({"status": "invalid"}, status=400)

    body = json.loads(request.body)
    logger.info(f"Ricevuti {len(body)} record dal frontend")

    for row in body:
        # Seleziona il campo "nome" in base al file
        nome = row.get("Descrizione") or row.get("descrizione") or row.get("ragionesociale")
        if not nome:
            logger.warning(f"Riga saltata (nessun nome identificativo): {row}")
            continue  # salta righe senza identificativo

        # Data di riferimento se presente
        intestazione = next(
            (k for k in row.keys() if re.match(r'(\d{2})\s([a-z]{3})\s(\d{4})', k, re.IGNORECASE)),
            None
        )
        data_riferimento = estrai_data_da_header(intestazione) if intestazione else None

        # Data di nascita se presente
        data_excel = row.get("Data di Nascita Cliente") or row.get("DataNascita") or None
        data_nascita = excel_serial_to_date(data_excel) if data_excel else None

        # Tipologia e APL
        tipologia = row.get("tipologia") or row.get("TIPOLOGIA") or ""
        apl = row.get("apl") or ""

        # Funzione helper per campi numerici
        def parse_float(*keys):
            for key in keys:
                val = row.get(key)
                if val not in (None, ""):
                    try:
                        return float(val)
                    except Exception as e:
                        logger.warning(f"Errore convertendo {key}='{val}' in float: {e}")
                        return 0
            return 0

        # defaults comuni
        defaults = {
            "data_nascita": data_nascita.date() if data_nascita else None,
            "indirizzo": row.get("Indirizzo Cliente", ""),
            "codice_fiscale": row.get("Codice Fiscale Cliente", ""),
            "assistenza_domiciliare_integrata": parse_float("Assistenza Domiciliare Integrata", "C-ADI"),
            "anziano_autosufficiente": parse_float("Anziano Autosufficiente", "C - Anziano autosufficiente"),
            "anziano_non_autosufficiente": parse_float("Anziano Non Autosufficiente", "C - Anziano non autosufficiente"),
            "contratti_privati": parse_float("Contratti Privati", "C - Contratti privati"),
            "disabile": parse_float("Disabile", "C - Disabile"),
            "emergenza_caldo_asl": parse_float("Emergenza Caldo ASL", "C - EMERGENZA CALDO ASL"),
            "emergenza_caldo_comune": parse_float("Emergenza Caldo Comune", "C - EMERGENZA CALDO COMUNE"),
            "hcp": parse_float("HCP", "C - HCP"),
            "minori_disabili_gravi": parse_float("Minori Disabili Gravi", "C - Minori disabili gravi"),
            "nord_ovest": parse_float("Nord Ovest", "C - Nord Ovest"),
            "pnrr": parse_float("PNRR", "C - PNRR"),
            "progetto_sod": parse_float("Progetto SOD", "C - Progetto SOD"),
            "sud_est": parse_float("Sud Est", "C - Sud Est"),
            "sud_ovest": parse_float("Sud Ovest", "C - Sud Ovest"),
            "ufficio": parse_float("Ufficio", "C - Ufficio"),
            "via_tesso": parse_float("C - UFFICIO VIA TESSO"),
            "totale_ore": parse_float("Totale"),
            "data_riferimento": data_riferimento,
        }

        # aggiorno tipologia e apl solo se arrivano valorizzati
        if tipologia:
            defaults["tipologia"] = tipologia
        if apl:
            defaults["apl"] = apl

        # Distretti - inizializziamo i valori come zero
        distretto = row.get("distretto", "").strip()  # Distretto generico
        distretto_value = None  # Variabile per il valore del distretto

        # Mappiamo i distretti specifici (Nord, Sud, etc.)
        if "nord" in distretto.lower():
            distretto_value = "Nord"
            defaults["distretto_nord"] = parse_float("Distretto Nord", "C - DISTRETTO NORD")
        elif "sud" in distretto.lower():
            distretto_value = "Sud"
            defaults["distretto_sud"] = parse_float("Distretto Sud", "C - DISTRETTO SUD")
        elif "nord ovest" in distretto.lower():
            distretto_value = "Nord Ovest"
            defaults["nord_ovest"] = parse_float("Nord Ovest", "C - Nord Ovest")
        elif "sud ovest" in distretto.lower():
            distretto_value = "Sud Ovest"
            defaults["sud_ovest"] = parse_float("Sud Ovest", "C - Sud Ovest")
        elif "est" in distretto.lower():
            distretto_value = "Sud Est"
            defaults["sud_est"] = parse_float("Sud Est", "C - Sud Est")
        else:
            # Se non è identificato, possiamo considerare un distretto generico
            distretto_value = "Non Specificato"

        if distretto_value:
            defaults["distretto"] = distretto_value

        # Aggiungi il campo oretotmese
        defaults["oretotmese"] = parse_float("OreTotMese", "Ore Totale Mese")

        # Crea o aggiorna l'utente
        utente, created = Utente.objects.update_or_create(
            nome=nome.strip(),
            defaults=defaults
        )

        if created:
            print(f"Creato nuovo utente: {nome.strip()}")
        else:
            print(f"Aggiornato utente esistente: {nome.strip()}")

    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_POST
def reset_utenti(request):
    try:
        Utente.objects.all().delete();
        return JsonResponse({"Status": "ok", "message": "Risposta server: Dati cancellati con successo"})
    except Exception as e:
        return JsonResponse({"Status": "error", "message": str(e)}, status=500)

def lista_utenti(request):
    utenti = list(Utente.objects.values())
    return JsonResponse(utenti, safe=False)
def home(request):
    return render(request, 'index.html')    