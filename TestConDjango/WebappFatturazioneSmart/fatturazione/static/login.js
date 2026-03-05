// Neumorphism Login Form JS (versione compatibile con Django)

class NeumorphismLoginForm {

constructor() {

this.form = document.getElementById('loginForm');
this.usernameInput = document.getElementById('username');
this.passwordInput = document.getElementById('password');
this.passwordToggle = document.getElementById('passwordToggle');
this.submitButton = this.form.querySelector('.login-btn');

this.init();

}

init() {

this.bindEvents();
this.setupPasswordToggle();

}

bindEvents() {

this.form.addEventListener('submit', (e) => this.handleSubmit(e));

this.usernameInput.addEventListener('input', () => this.clearError('username'));
this.passwordInput.addEventListener('input', () => this.clearError('password'));

}

setupPasswordToggle() {

this.passwordToggle.addEventListener('click', () => {

const type = this.passwordInput.type === 'password' ? 'text' : 'password';
this.passwordInput.type = type;

});

}

handleSubmit(e) {

const username = this.usernameInput.value.trim();
const password = this.passwordInput.value.trim();

if (!username) {

e.preventDefault();
this.showError('username', 'Username is required');
return;

}

if (!password) {

e.preventDefault();
this.showError('password', 'Password is required');
return;

}

// se i campi sono validi il form viene inviato a Django
this.submitButton.classList.add("loading");

}

showError(field, message) {

const errorElement = document.getElementById(field + "Error");

if (errorElement) {
errorElement.textContent = message;
errorElement.style.display = "block";
}

}

clearError(field) {

const errorElement = document.getElementById(field + "Error");

if (errorElement) {
errorElement.textContent = "";
errorElement.style.display = "none";
}

}

}

document.addEventListener('DOMContentLoaded', () => {

new NeumorphismLoginForm();

});
