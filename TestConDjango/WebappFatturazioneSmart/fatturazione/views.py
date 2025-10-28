from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import logging
from .models import Utente
from .models import Tariffa
from datetime import datetime, timedelta
from django.shortcuts import render
import re

# Configura logger
logger = logging.getLogger(__name__)
DEBUG_COUNT = 0

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
    try:
        if request.method != "POST":
            return JsonResponse({"status": "invalid"}, status=400)

        body = json.loads(request.body)
        #logger.info(f"Ricevuti {len(body)} record dal frontend")
        #print(f"📦 Corpo ricevuto: {request.body}")
        #print(f"Ricevuti {len(body)} record dal frontend")

        for row in body:
            # Seleziona il campo "nome" in base al file
            nome = row.get("Descrizione") or row.get("descrizione") or row.get("ragionesociale")
            if not nome:
                logger.warning(f"Riga saltata (nessun nome identificativo): {row}")
                continue  # salta righe senza identificativo
            #tariffa_val = get_tariffa(row.get("apl") or row.get("tipologia"))
            tariffa_val = get_tariffa(
                prestazione=row.get("tipologia") or row.get("apl"),
                descrizionetipologia=row.get("descrizionetipologia"),
                apl=row.get("apl")
            )
            # Data di riferimento se presente
            intestazione = next(
                (k for k in row.keys() if re.match(r'(\d{2})\s([a-z]{3})\s(\d{4})', k, re.IGNORECASE)),
                None
            )
            data_riferimento = estrai_data_da_header(intestazione) if intestazione else None

            # Data di nascita se presente
            data_excel = row.get("Data di Nascita Cliente") or row.get("DataNascita") or None
            data_nascita = excel_serial_to_date(data_excel) if data_excel else ""

            # Tipologia e APL
            tipologia = row.get("tipologia") or row.get("TIPOLOGIA") or ""
            apl = row.get("apl") or ""

            #ore tot mese
            raw_ore= row.get("buonoservizio", 0)
            def parse_ore(value):
                if value in (None, ""):
                    return 0.0
                if isinstance(value, (int, float)):
                    return float(value)
                match = re.search(r'\d+(?:[.,]\d+)?', str(value))
                return float(match.group().replace(",", ".")) if match else 0.0
            buonoservizio = parse_ore(raw_ore) 

            
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
            codice_fiscale = (row.get("Codice Fiscale Cliente") or "").strip()
            utente = Utente.objects.all()

            
            #print(list(Utente.objects.all().values()))
            # defaults comuni (non anagrafici)
            #print(f"Chiavi disponibili: {row.keys()}")
            '''
            print("\n" + "="*80)
            print(f"🔹 Nuova riga dal file:")
            print(json.dumps(row, indent=2, ensure_ascii=False))  # mostra tutte le chiavi e valori della riga
            print(f"Chiavi disponibili: {list(row.keys())}")
            print("="*80)
            '''
            defaults = {
                "assistenza_domiciliare_integrata": parse_float("Assistenza Domiciliare Integrata", "C-ADI", "0.00"),
                "anziano_autosufficiente": parse_float("Anziano Autosufficiente", "C - Anziano autosufficiente", "0.00"),
                "anziano_non_autosufficiente": parse_float("Anziano Non Autosufficiente", "C - Anziano non autosufficiente", "0.00"),
                "contratti_privati": parse_float("Contratti Privati", "C - Contratti privati", "0.00"),
                "disabile": parse_float("Disabile", "C - Disabile", "0.00"),
                "emergenza_caldo_asl": parse_float("Emergenza Caldo ASL", "C - EMERGENZA CALDO ASL", "0.00"),
                "emergenza_caldo_comune": parse_float("Emergenza Caldo Comune", "C - EMERGENZA CALDO COMUNE", "0.00"),
                "hcp": parse_float("HCP", "C - HCP", "0.00"),
                "minori_disabili_gravi": parse_float("Minori Disabili Gravi", "C - Minori Disabili Gravi", "0.00"),
                "nord_ovest": parse_float("Nord Ovest", "C - Nord Ovest"),
                "distretto_nord": parse_float("Distretto Nord", "C - DISTRETTO NORD", "0.00"),
                "distretto_nord_est": 0,
                "distretto_sud": parse_float("Distretto Sud", "C - DISTRETTO SUD", "0.00"),
                "pnrr": parse_float("PNRR", "C - PNRR", "0.00"),
                "progetto_sod": parse_float("Progetto SOD", "C - Progetto SOD", "0.00"),
                "sud_est": parse_float("Sud Est", "C - Sud-Est", "0.00"),
                "sud_ovest": parse_float("Sud Ovest", "C - Sud-Ovest", "0.00"),
                "ufficio": parse_float("Ufficio", "C - Ufficio", "0.00"),
                "via_tesso": parse_float("C - UFFICIO VIA TESSO", "0.00"),
                "totale_ore": parse_float("Totale", "0.00"),
                "data_riferimento": data_riferimento,
                "oretotmese": row.get("oretotmese", 0),
                "tariffa": tariffa_val or 0,
                "descrizionetipologia": row.get("descrizionetipologia",0),
                "lavoratore": row.get("lavoratore",0),
                "periodo_documento": row.get("periodo_documento",0),
            }
            #print(f"Nome Utente: {row.get('C - Anziano autosufficiente')}")
            #print(f"Tariffa per dopo defoult {nome}: {tariffa_val}")
            #IL print qui sotto serve per debug delle tipologie non mappate delle APL
            #print(f"Descrizione tipologia: {defaults['descrizionetipologia']}")
            
            if buonoservizio:
                defaults["buonoservizio"] = buonoservizio
            # aggiorno tipologia e apl solo se arrivano valorizzati
            if tipologia:
                defaults["tipologia"] = tipologia
            if apl:
                defaults["apl"] = apl

            # campi anagrafici → SOLO SE valorizzati
            if data_nascita:
                defaults["data_nascita"] = data_nascita.date()
            if row.get("Indirizzo Cliente"):
                defaults["indirizzo"] = row.get("Indirizzo Cliente")
            cf = (row.get("Codice Fiscale Cliente") or "").strip()
            if cf not in (None, "", 0):
                defaults["codice_fiscale"] = row.get("Codice Fiscale Cliente")
            else:
                defaults["codice_fiscale"] = "CF Mancante"

            #calcolo del periodo del documento
            periodo_documento = calcola_periodo_documento(row.get("periodo_documento"))
            defaults["periodo_documento"] = periodo_documento
            #print(f"periodo_documento", periodo_documento)
            # gestione distretto come prima → AGGIORNO SOLO SE DISTRETTO VALORIZZATO

            ore = row.get("oretotmese")
            
            distretto_value=""            
            if row.get("distretto") in (7,6):
                distretto_value = "Nord Est"
                defaults["distretto_nord_est"] = ore
            elif row.get("distretto") in (4,5):
                distretto_value = "Nord Ovest"
                defaults["nord_ovest"] = ore
            elif row.get("distretto") == 2:
                distretto_value = "Sud Ovest"
                defaults["sud_ovest"] = ore
            else:
                distretto = (row.get("distretto") or "").strip()
                if distretto and ore not in (None, "", 0):
                    distretto_value = None
                    d = distretto.lower()
                    if "nord ovest" in d:
                        distretto_value = "Nord Ovest"
                        defaults["nord_ovest"] = ore
                    elif "sud ovest" in d:
                        distretto_value = "Sud Ovest"
                        defaults["sud_ovest"] = ore
                    elif "sud est" in d:
                        distretto_value = "Sud Est"
                        defaults["sud_est"] = ore
                    elif "sud" in d:
                        distretto_value = "Sud"
                        defaults["distretto_sud"] = ore               
                    elif "nord est" in d:
                        distretto_value = "Nord Est"
                        defaults["distretto_nord_est"] = ore                    
                    elif "nord" in d:
                        distretto_value = "Nord"
                        defaults["distretto_nord"] = ore              
                    else:
                        distretto_value = "Non Specificato"
                        defaults["distretto"] = ore

                if distretto_value:
                    defaults["distretto"] = distretto_value       
                    

            clean_defaults = {k: v for k, v in defaults.items() if v not in (None, "")}
             #In Django non perdo i dati per via del filtro if v not in (None, "") prima di fare l’update.
            # Rimuovo le chiavi già passate esplicitamente
            clean_defaults.pop("tipologia", None)
            clean_defaults.pop("apl", None)
            #nel caso oretotmese sia vuoto quindi con "", si restituisce 0
            raw_ore = row.get("buonoservizio")

            def parse_ore(value):
                if value in (None, ""):
                    return 0.0
                if isinstance(value, (int, float)):
                    return float(value)
                match = re.search(r'\d+(?:[.,]\d+)?', str(value))
                return float(match.group().replace(",", ".")) if match else 0.0
            buonoservizio = parse_ore(raw_ore) 

            utente, created = Utente.objects.update_or_create(
                codice_fiscale = codice_fiscale if codice_fiscale not in (None, "") else "CF Mancante",
                oretotmese= row.get("oretotmese",""),
                lavoratore= row.get("lavoratore", ""),
                defaults={
                    "nome": nome.strip(),
                    "tipologia": tipologia,
                    "apl": apl,
                    "oretotmese": row.get("oretotmese",""),
                    "lavoratore": row.get("lavoratore", ""),
                    **clean_defaults
                }
            ) 
            logger.info(f"🧾 Utente salvato: {utente.nome}, creato={created}")       
        return JsonResponse({"status": "ok"})
    except Exception as e:
            logger.exception("Errore durante il salvataggio")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_POST
@csrf_exempt
def salva_tariffe(request):
    try:
        payload = json.loads(request.body)
        dati = payload.get("dati", [])

        for item in dati:
            prestazione = item.get("prestazione", "")
            apl = item.get("apl", "").strip()
            descrizione = str(item.get("descrizionetipologia") or "").strip()
            valore = item.get("valore")

            if valore in (None, ""):
                continue  # ignora record incompleti

            #1. Aggiorna o crea la tariffa specifica
            tariffa, created = Tariffa.objects.update_or_create(
                tipologia=prestazione,
                apl=apl,
                descrizionetipologia=descrizione,
                defaults={"valore": valore},
            )

            print(f"Descrizione nel filtro: '{descrizione}'")

            
            action = "Creata" if created else "Aggiornata"
            #print(f"{action} tariffa: {prestazione} | APL: {apl or '-'} | Tipo: {descrizione or '-'} | Valore: {valore}")
            
            filtri = {}
            #2. Aggiorna tutti gli utenti collegati
            if prestazione:
                filtri = {"tipologia": prestazione}

            if apl:
                filtri["apl"] = apl.strip()
            elif descrizione:
                filtri["descrizionetipologia__iexact"] = descrizione.strip()



            utenti = Utente.objects.filter(**filtri)
            print(f"Filtri usati: {filtri}")
            print(f"Query SQL: {utenti.query}")
            print(f"Trovati {utenti.count()} utenti per {filtri}")

            utenti.update(tariffa=valore)
            print(Utente.objects.filter(**filtri).values_list("tariffa", flat=True)[:10])


        return JsonResponse({"status": "ok", "message": "Tariffe aggiornate correttamente"})

    except Exception as e:
        print("❌ Errore salva_tariffe:", e)
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

    
def get_tariffa(prestazione, descrizionetipologia=None, apl=None):
    """
    Restituisce il valore della tariffa per tipologia, descrizionetipologia e opzionalmente APL.
    """
    qs = Tariffa.objects.filter(tipologia=prestazione)

    if descrizionetipologia:
        qs = qs.filter(descrizionetipologia__iexact=str(descrizionetipologia).strip())

    if apl:
        qs = qs.filter(apl__iexact=str(apl).strip())

    if not qs.exists():
        return None  # Nessuna tariffa trovata

    return qs.first().valore  # prendi la prima riga



@csrf_exempt
@require_POST
def reset_utenti(request):
    try:
        Utente.objects.all().delete();
        return JsonResponse({"Status": "ok", "message": "Risposta server: Dati cancellati con successo"})
    except Exception as e:
        return JsonResponse({"Status": "error", "message": str(e)}, status=500)
    
@csrf_exempt
@require_POST
def reset_tariffe(request):
    try:
        Tariffa.objects.all().delete();
        return JsonResponse({"Status": "ok", "message": "Risposta server: Tariffe cancellate con successo"})
    except Exception as e:
        return JsonResponse({"Status": "error", "message": str(e)}, status=500)


def lista_utenti(request):
    utenti = list(Utente.objects.values())
    return JsonResponse(utenti, safe=False)
def lista_tariffe(request):
    tariffe = list(Tariffa.objects.values("tipologia","descrizionetipologia","apl","valore"))
    return JsonResponse(tariffe, safe=False)
def home(request):
    return render(request, 'index.html')    
def calcola_periodo_documento(periodo):
    if not periodo:
        return None

    periodo = str(periodo).strip()

    # Caso 1: formato "MM/YYYY"
    if "/" in periodo:
        try:
            mese, anno = periodo.split("/")
        except ValueError:
            return None

    # Caso 2: formato "YYYYMM" o "YYYYM"
    elif len(periodo) >= 6 and periodo.isdigit():
        anno = periodo[:4]
        mese = periodo[4:]
    else:
        return None

    # Normalizza mese in intero (rimuove eventuali zeri iniziali se ci sono)
    try:
        mese = int(mese)
    except ValueError:
        return None

    # Dizionario dei mesi
    mesi = {
        1: "Gennaio",
        2: "Febbraio",
        3: "Marzo",
        4: "Aprile",
        5: "Maggio",
        6: "Giugno",
        7: "Luglio",
        8: "Agosto",
        9: "Settembre",
        10: "Ottobre",
        11: "Novembre",
        12: "Dicembre"
    }

    nome_mese = mesi.get(mese, "Mese sconosciuto")
    return nome_mese
