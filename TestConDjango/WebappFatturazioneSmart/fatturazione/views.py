from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Utente
from datetime import datetime, timedelta
from django.shortcuts import render


def excel_serial_to_date(serial):
    if isinstance(serial, (int, float)):
        return datetime(1899, 12, 30) + timedelta(days=serial)
    return None

@csrf_exempt
def salva_dati(request):
    if request.method == "POST":
        body = json.loads(request.body)
        Utente.objects.all().delete()  # cancella vecchi dati
        for row in body:
            '''print("Row ricevuta:", row)'''
            data_excel = row.get("Data di Nascita Cliente")
            data_nascita = excel_serial_to_date(data_excel) if data_excel else None
            Utente.objects.create(
                nome=row.get("Descrizione", ""),
                data_nascita = data_nascita.date() if data_nascita else None,
                indirizzo=row.get("Indirizzo Cliente", ""),
                codice_fiscale=row.get("Codice Fiscale Cliente", ""),

                assistenza_domiciliare_integrata=float((row.get("Assistenza Domiciliare Integrata", "") or row.get("C-ADI", "")),0),
                anziano_autosufficiente=row.get("Anziano Autosufficiente", "") or row.get("C - Anziano autosufficiente", ""),
                anziano_non_autosufficiente=row.get("Anziano Non Autosufficiente", "") or row.get("C - Anziano non autosufficiente", ""),
                contratti_privati=row.get("Contratti Privati", "") or row.get("C - Contratti privati", ""),
                disabile=row.get("Disabile", "") or row.get("C - Disabile", ""),
                distretto_nord=row.get("Distretto Nord", "") or row.get("C - DISTRETTO NORD", ""),
                distretto_sud=row.get("Distretto Sud", "") or row.get("C - DISTRETTO SUD", ""),
                emergenza_caldo_asl=row.get("Emergenza Caldo ASL", "") or row.get("C - EMERGENZA CALDO ASL", ""),
                emergenza_caldo_comune=row.get("Emergenza Caldo Comune", "") or row.get("C - EMERGENZA CALDO COMUNE", ""),
                hcp=row.get("HCP", "") or row.get("C - HCP", ""),
                minori_disabili_gravi=row.get("Minori Disabili Gravi", "") or row.get("C - Minori disabili gravi", ""),
                nord_ovest=row.get("Nord Ovest", "") or row.get("C - Nord Ovest", ""),
                pnrr=row.get("PNRR", "") or row.get("C - PNRR", ""),
                progetto_sod=row.get("Progetto SOD", "") or row.get("C - Progetto SOD", ""),
                sud_est=row.get("Sud Est", "") or row.get("C - Sud Est", ""),
                sud_ovest=row.get("Sud Ovest", "") or row.get("C - Sud Ovest", ""),
                ufficio=row.get("Ufficio", "") or row.get("C - Ufficio", ""),
                via_tesso=row.get("C - UFFICIO VIA TESSO", ""),

                totale_ore=float(row.get("Totale", 0))
            )
        return JsonResponse({"status": "ok"})
    return JsonResponse({"status": "invalid"}, status=400)


def lista_utenti(request):
    utenti = list(Utente.objects.values())
    return JsonResponse(utenti, safe=False)
def home(request):
    return render(request, 'index.html')    