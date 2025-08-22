from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Utente
from datetime import datetime, timedelta
from django.shortcuts import render
import re


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
    if request.method == "POST":
        body = json.loads(request.body)
        Utente.objects.all().delete()  # cancella vecchi dati
        for row in body:
            '''print("Row ricevuta:", row)'''
            '''print("Row ricevuta:", body[0])'''

            # Cerca la colonna che ha una data come "01 lug 2025"
            intestazione = next((key for key in row.keys() if re.match(r'(\d{2})\s([a-z]{3})\s(\d{4})', key, re.IGNORECASE)), None)

            if intestazione:
                # Estrai la data dal header
                data_riferimento = estrai_data_da_header(intestazione)
            else:
                data_riferimento = None


            data_excel = row.get("Data di Nascita Cliente")
            data_nascita = excel_serial_to_date(data_excel) if data_excel else None

            Utente.objects.create(
                nome=row.get("Descrizione", ""),
                data_nascita = data_nascita.date() if data_nascita else None,
                indirizzo=row.get("Indirizzo Cliente", ""),
                codice_fiscale=row.get("Codice Fiscale Cliente", ""),

                assistenza_domiciliare_integrata = float((row.get("Assistenza Domiciliare Integrata", "") or row.get("C-ADI", "")) or 0),
                anziano_autosufficiente = float((row.get("Anziano Autosufficiente", "") or row.get("C - Anziano autosufficiente", "")) or 0),
                anziano_non_autosufficiente = float((row.get("Anziano Non Autosufficiente", "") or row.get("C - Anziano non autosufficiente", "")) or 0),
                contratti_privati = float((row.get("Contratti Privati", "") or row.get("C - Contratti privati", "")) or 0),
                disabile = float((row.get("Disabile", "") or row.get("C - Disabile", "")) or 0),
                distretto_nord = float((row.get("Distretto Nord", "") or row.get("C - DISTRETTO NORD", "")) or 0),
                distretto_sud = float((row.get("Distretto Sud", "") or row.get("C - DISTRETTO SUD", "")) or 0),
                emergenza_caldo_asl = float((row.get("Emergenza Caldo ASL", "") or row.get("C - EMERGENZA CALDO ASL", "")) or 0),
                emergenza_caldo_comune = float((row.get("Emergenza Caldo Comune", "") or row.get("C - EMERGENZA CALDO COMUNE", "")) or 0),
                hcp = float((row.get("HCP", "") or row.get("C - HCP", "")) or 0),
                minori_disabili_gravi = float((row.get("Minori Disabili Gravi", "") or row.get("C - Minori disabili gravi", "")) or 0),
                nord_ovest = float((row.get("Nord Ovest", "") or row.get("C - Nord Ovest", "")) or 0),
                pnrr = float((row.get("PNRR", "") or row.get("C - PNRR", "")) or 0),
                progetto_sod = float((row.get("Progetto SOD", "") or row.get("C - Progetto SOD", "")) or 0),
                sud_est = float((row.get("Sud Est", "") or row.get("C - Sud Est", "")) or 0),
                sud_ovest = float((row.get("Sud Ovest", "") or row.get("C - Sud Ovest", "")) or 0),
                ufficio = float((row.get("Ufficio", "") or row.get("C - Ufficio", "")) or 0),
                via_tesso = float((row.get("C - UFFICIO VIA TESSO", "")) or 0),

                totale_ore=float(row.get("Totale", 0)),

                data_riferimento=data_riferimento  # Salva la data di riferimento
            )
        return JsonResponse({"status": "ok"})
    return JsonResponse({"status": "invalid"}, status=400)


def lista_utenti(request):
    utenti = list(Utente.objects.values())
    return JsonResponse(utenti, safe=False)
def home(request):
    return render(request, 'index.html')    