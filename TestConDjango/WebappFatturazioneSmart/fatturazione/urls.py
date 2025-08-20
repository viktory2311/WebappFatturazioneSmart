from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # <-- root path
    path('salva/', views.salva_dati, name="salva_dati"),
    path('utenti/', views.lista_utenti, name="lista_utenti"),
]
