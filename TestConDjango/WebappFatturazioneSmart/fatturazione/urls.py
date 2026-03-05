from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('home/', views.home, name='home'),  # <-- root path
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path('salva/', views.salva_dati, name="salva_dati"),
    path('utenti/', views.lista_utenti, name="lista_utenti"),
    path('reset/', views.reset_utenti, name="reset_utenti"),
    path('resetTariffe/', views.reset_tariffe, name="reset_tariffe"),
    path("tariffe/", views.lista_tariffe, name="lista_tariffe"),
    path("tariffe/salva/", views.salva_tariffe, name="salva_tariffe"),
]
