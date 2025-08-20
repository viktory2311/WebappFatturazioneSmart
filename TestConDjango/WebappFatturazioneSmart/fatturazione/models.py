from django.db import models

class Utente(models.Model):
    nome = models.CharField(max_length=200)
    data_nascita = models.DateField(null=True, blank=True)
    indirizzo = models.CharField(max_length=255, blank=True)
    codice_fiscale = models.CharField(max_length=16, blank=True)

     # Colonne da C-ADI fino Minori Disabili Gravi
    assistenza_domiciliare_integrata = models.CharField(max_length=255, blank=True)
    anziano_autosufficiente = models.CharField(max_length=255, blank=True)
    anziano_non_autosufficiente = models.CharField(max_length=255, blank=True)
    contratti_privati = models.CharField(max_length=255, blank=True)
    disabile = models.CharField(max_length=255, blank=True)
    distretto_nord = models.CharField(max_length=255, blank=True)
    distretto_sud = models.CharField(max_length=255, blank=True)
    emergenza_caldo_asl = models.CharField(max_length=255, blank=True)
    emergenza_caldo_comune = models.CharField(max_length=255, blank=True)
    hcp = models.CharField(max_length=255, blank=True)
    minori_disabili_gravi = models.CharField(max_length=255, blank=True)

    # Colonne da Nord Ovest fino Via Tesso
    nord_ovest = models.CharField(max_length=255, blank=True)
    pnrr = models.CharField(max_length=255, blank=True)
    progetto_sod = models.CharField(max_length=255, blank=True)
    sud_est = models.CharField(max_length=255, blank=True)
    sud_ovest = models.CharField(max_length=255, blank=True)
    ufficio = models.CharField(max_length=255, blank=True)
    via_tesso = models.CharField(max_length=255, blank=True)

    totale_ore = models.FloatField(default=0)

    def __str__(self):
        return self.nome
