from django.db import models

class Utente(models.Model):
    nome = models.CharField(max_length=200)
    data_nascita = models.DateField(null=True, blank=True)
    indirizzo = models.CharField(max_length=255, blank=True)
    codice_fiscale = models.CharField(max_length=16, blank=True)

     # Colonne da C-ADI fino Minori Disabili Gravi
    assistenza_domiciliare_integrata = models.FloatField(default=0)
    anziano_autosufficiente = models.FloatField(default=0)
    anziano_non_autosufficiente = models.FloatField(default=0)
    contratti_privati = models.FloatField(default=0)
    disabile = models.FloatField(default=0)
    distretto_nord = models.FloatField(default=0)
    distretto_nord_est = models.FloatField(default=0)
    distretto_sud = models.FloatField(default=0)
    emergenza_caldo_asl = models.FloatField(default=0)
    emergenza_caldo_comune = models.FloatField(default=0)
    hcp = models.FloatField(default=0)
    minori_disabili_gravi = models.FloatField(default=0)

    # Colonne da Nord Ovest fino Via Tesso
    nord_ovest = models.FloatField(default=0)
    pnrr = models.FloatField(default=0)
    progetto_sod = models.FloatField(default=0)
    sud_est = models.FloatField(default=0)
    sud_ovest = models.FloatField(default=0)
    ufficio = models.FloatField(default=0)
    via_tesso = models.FloatField(default=0)
    tipologia = models.CharField(max_length=16, blank=True)
    apl = models.CharField(max_length=16, blank=True)
    distretto = models.CharField(max_length=32, blank=True)
    oretotmese = models.FloatField(default=0)
    buonoservizio = models.FloatField(default=0)
    tariffa =  models.FloatField(default=0)
    descrizionetipologia = models.CharField(max_length=16, blank=True)
    lavoratore = models.CharField(max_length=16, blank=True)


    totale_ore = models.FloatField(default=0)

    data_riferimento = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.nome

class Tariffa(models.Model):
    tipologia = models.CharField(max_length=50)    # Es. "SYNERGIE", "OSS"
    valore = models.DecimalField(max_digits=6, decimal_places=2)
    descrizionetipologia = models.CharField(max_length=100, blank=True, null=True)
    apl = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.tipologia} - {self.apl or '---'} - {self.descrizionetipologia or '---'}: {self.valore} €"

