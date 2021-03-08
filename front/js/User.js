import '../scss/User.scss';
import Kom from './utils/Kom';
import Events from './utils/Events';
import ModalFactory from './modal/ModalFactory';


const kom = new Kom();
window.kom = kom;
const events = new Events();
window.events = events;


const clearErrorClasses = obj => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; ++i) {
    obj[keys[i]].classList.remove('error');
  }
};


const editProfileInfoSubmit = document.querySelector('#edit-profile-info-submit');
if (editProfileInfoSubmit) {
  const dom = {
    username: document.querySelector('#username'),
    email: document.querySelector('#email'),
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };

  const processResponse = res => {
    dom.loading.style.opacity = '0';
    if (res.status === 200) {
      dom.username.value = res.info.username;
      dom.email.value = res.info.email;
      if (res.taken.username) { dom.username.classList.add('error'); }
      if (res.taken.email) { dom.email.classList.add('error'); }
      if (res.message) { dom.error.innerHTML = res.message; }
    } else if (res.code === 'B_PROFILE_UPDATE_INFO_INVALID_FIELD') {
      dom.username.classList.add('error');
      dom.email.classList.add('error');
    } else if (res.code === 'B_PROFILE_UPDATE_INFO_MISSING_FIELD') {
      dom.username.classList.add('error');
      dom.email.classList.add('error');
    } else if (res.code === 'B_PROFILE_UPDATE_INFO_NO_CHANGES') {
      dom.error.innerHTML = res.message;
    }
  };

  editProfileInfoSubmit.addEventListener('click', event => {
    event.preventDefault();
    const formData = new FormData(document.querySelector('#edit-profile-info-form'));
    const parameters = Object.fromEntries(formData.entries());
    dom.loading.style.opacity = '1';
    dom.error.innerHTML = '';
    clearErrorClasses(dom);
    kom.post('/api/user/update/info', parameters).then(processResponse).catch(processResponse);
  });
}


const editProfilePasswordSubmit = document.querySelector('#edit-profile-password-submit');
if (editProfilePasswordSubmit) {
  const dom = {
    pass1: document.querySelector('#pass1'),
    pass2: document.querySelector('#pass2'),
    pass3: document.querySelector('#pass3'),
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };

  const processResponse = res => {
    dom.loading.style.opacity = '0';
    dom.error.innerHTML = res.message;
    if (res.status === 200) {
      dom.pass1.value = '';
      dom.pass2.value = '';
      dom.pass3.value = '';
    } else {
      dom.error.classList.add('error');
      if (res.code === 'B_PROFILE_UPDATE_PASSWORD_INVALID_FIELD') {
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
        dom.pass3.classList.add('error');
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_EMPTY_FIELD') {
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
        dom.pass3.classList.add('error');
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_MISSING_FIELD') {
        if (res.missing.pass1) { dom.pass1.classList.add('error'); }
        if (res.missing.pass2) { dom.pass2.classList.add('error'); }
        if (res.missing.pass3) { dom.pass3.classList.add('error'); }
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_DIFFERENT_PASSWORDS') {
        dom.pass2.classList.add('error');
        dom.pass3.classList.add('error');
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_SAME_PASSWORDS') {
        dom.pass1.classList.add('error');
        dom.pass2.classList.add('error');
        dom.pass3.classList.add('error');
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_PASSWORD_TOO_SHORT') {
        dom.pass2.classList.add('error');
        dom.pass3.classList.add('error');
      } else if (res.code === 'B_PROFILE_UPDATE_PASSWORD_INVALID_PASSWORD') {
        dom.pass1.classList.add('error');
      }
    }
  };

  editProfilePasswordSubmit.addEventListener('click', event => {
    event.preventDefault();
    const formData = new FormData(document.querySelector('#edit-profile-password-form'));
    const parameters = Object.fromEntries(formData.entries());
    dom.loading.style.opacity = '1';
    dom.error.innerHTML = '';
    clearErrorClasses(dom);
    kom.post('/api/user/update/password', parameters).then(processResponse).catch(processResponse);
  });
}


const uploadProfileAvatarSubmit = document.querySelector('#upload-profile-avatar-submit');
if (uploadProfileAvatarSubmit) {
  const dom = {
    avatar: document.querySelector('#avatar'),
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };

  const processResponse = res => {
    dom.loading.style.opacity = '0';
    dom.error.innerHTML = res.message;

    if (res.status === 200) {
      window.location.href = res.url;
    } else {
      dom.error.classList.add('error');
      if (res.code === 'B_PROFILE_UPDATE_PASSWORD_INVALID_FIELD') {
        dom.avatar.classList.add('error');
      } else if (res.code === 'F_KOM_XHR_ERROR') {
        dom.error.innerHTML = 'Error sending avatar to the server';
      } else if (res.code === 'B_PROFILE_UPLOAD_AVATAR_SIZE_ERROR') {
        dom.avatar.classList.add('error');
      }
    }
  };

  const avatars = document.querySelector('#avatars');
  for (let i = 0; i < avatars.children.length; ++i) {
    const parameters = {
      src: avatars.children[i].children[0].src
    };

    if (i !== 0) {
      avatars.children[i].children[0].addEventListener('click', () => {
        dom.loading.style.opacity = '1';
        dom.error.innerHTML = '';
        clearErrorClasses(dom);
        kom.post('/api/user/update/avatar', parameters).then(processResponse).catch(processResponse);
      });
    }

    avatars.children[i].children[1].addEventListener('click', () => {
      dom.loading.style.opacity = '1';
      dom.error.innerHTML = '';
      clearErrorClasses(dom);
      kom.post('/api/user/delete/avatar', parameters).then(processResponse).catch(processResponse);
    });
  }

  uploadProfileAvatarSubmit.addEventListener('click', event => {
    event.preventDefault();
    const formData = new FormData(document.querySelector('#edit-profile-avatar-form'));
    dom.loading.style.opacity = '1';
    dom.error.innerHTML = '';
    clearErrorClasses(dom);
    kom.xhr('POST', '/api/user/upload/avatar', formData).then(processResponse).catch(processResponse);
  });
}


const deleteAccount = document.querySelector('#delete-account');
if (deleteAccount) {
  const error = document.querySelector('#error-output');

  const processResponse = res => {
    if (res.status === 200) {
      window.location.href = res.url;
    } else if (res.code === 'B_NEVER_KILL_ROOT') {
      error.innerHTML = res.message;
    }
  };

  deleteAccount.addEventListener('click', () => {
    new ModalFactory('DeleteAccount', {
      url: '/template/modal/delete/user',
      cb: () => {
        kom.get('/api/user/delete').then(processResponse).catch(processResponse);
      }
    });
  });
}
