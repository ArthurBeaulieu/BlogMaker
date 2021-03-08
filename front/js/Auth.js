import '../scss/Auth.scss';
import Kom from './utils/Kom';
const kom = new Kom();


const clearErrorClasses = obj => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; ++i) {
    obj[keys[i]].classList.remove('error');
  }
};


const registerSubmit = document.querySelector('#register-submit');
if (registerSubmit) {
  const dom = {
    username: document.querySelector('#username'),
    email: document.querySelector('#email'),
    code: document.querySelector('#code'),
    pass1: document.querySelector('#pass1'),
    pass2: document.querySelector('#pass2'),
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };
  // Method to react to the server response for a given form
  const processResponse = res => {
    dom.loading.style.opacity = '0';
    // Parse server response to react accordingly
    if (res.status === 200) {
      window.location.href = res.url;
    } else {
      // Handle backend errors
      dom.error.classList.add('error');
      dom.error.innerHTML = res.message;
      if (res.code === 'B_INVALID_FIELD') {
        dom.username.classList.add('error');
        dom.email.classList.add('error');
      } else if (res.code === 'B_MISSING_FIELD') {
        dom.username.classList.add('error');
        dom.email.classList.add('error');
      } else if (res.code === 'B_REGISTER_INVALID_FIELD') {
        dom.username.classList.add('error');
        dom.email.classList.add('error');
        dom.code.classList.add('error');
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
      } else if (res.code === 'B_REGISTER_EXISTING_USERNAME_AND_EMAIL') {
        dom.username.classList.add('error');
        dom.email.classList.add('error');
      } else if (res.code === 'B_REGISTER_EXISTING_USERNAME') {
        dom.username.classList.add('error');
      } else if (res.code === 'B_REGISTER_EXISTING_EMAIL') {
        dom.email.classList.add('error');
      } else if (res.code === 'B_REGISTER_MISSING_FIELD') {
        if (res.missing.username) { dom.username.classList.add('error'); }
        if (res.missing.email) { dom.email.classList.add('error'); }
        if (res.missing.code) { dom.code.classList.add('error'); }
        if (res.missing.pass1) { dom.pass1.classList.add('error'); }
        if (res.missing.pass2) { dom.pass2.classList.add('error'); }
      } else if (res.code === 'B_REGISTER_DIFFERENT_PASSWORDS') {
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
      } else if (res.code === 'B_REGISTER_PASSWORD_TOO_SHORT') {
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
      } else if (res.code === 'B_REGISTER_INVALID_CODE') {
        dom.code.classList.add('error');
      }
    }
  };
  // Register submit event listener
  registerSubmit.addEventListener('click', event => {
    event.preventDefault(); // Avoid default form redirection
    const formData = new FormData(document.querySelector('#register-form'));
    const parameters = Object.fromEntries(formData.entries());
    // Remove previous error classes and feedback
    dom.error.innerHTML = '';
    clearErrorClasses(dom);
    dom.loading.style.opacity = '1';
    kom.post('/api/auth/register', parameters).then(processResponse).catch(processResponse);
  });
}


const loginSubmit = document.querySelector('#login-submit');
if (loginSubmit) {
  const dom = {
    username: document.querySelector('#username'),
    password: document.querySelector('#password'),
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };
  // Method to react to the server response for a given form
  const processResponse = res => {
    dom.loading.style.opacity = '0';
    // Parse server response to react accordingly
    if (res.status === 200) {
      window.location.href = res.url;
    } else {
      // Handle backend errors
      dom.error.classList.add('error');
      dom.error.innerHTML = res.message;
      if (res.code === 'B_LOGIN_INVALID_FIELD') {
        dom.username.classList.add('error');
        dom.password.classList.add('error');
      } else if (res.code === 'B_LOGIN_MISSING_FIELD') {
        if (res.missing.username) { dom.username.classList.add('error'); }
        if (res.missing.password) { dom.password.classList.add('error'); }
      } else if (res.code === 'B_USER_NOT_FOUND') {
        dom.username.classList.add('error');
      } else if (res.code === 'B_LOGIN_INVALID_PASSWORD') {
        dom.password.classList.add('error');
      }
    }
  };
  // Login submit event listener
  loginSubmit.addEventListener('click', event => {
    event.preventDefault(); // Avoid default form redirection
    const formData = new FormData(document.querySelector('#login-form'));
    const parameters = Object.fromEntries(formData.entries());
    dom.loading.style.opacity = '1';
    // Remove previous error classes and feedback
    dom.error.innerHTML = '';
    clearErrorClasses(dom);
    kom.post('/api/auth/login', parameters).then(processResponse).catch(processResponse);
  });
}
