import '../scss/Admin.scss';
import Kom from './utils/Kom';
import Events from "./utils/Events";
import ModalFactory from "./modal/ModalFactory";


const kom = new Kom();
window.kom = kom;
const events = new Events();
window.events = events;


const lockRegistration = document.querySelector('#lock-registration');
const maxDepth = document.querySelector('#max-depth');
const usersList = document.querySelector('#users-list');
if (lockRegistration && maxDepth && usersList) {
  const dom = {
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };

  for (let i = 0; i < usersList.children.length; ++i) {
    const roles = usersList.children[i].querySelector('.user-roles');

    for (let j = 0; j < roles.children.length; ++j) {
      const revokeRoleInput = roles.children[j].lastElementChild;
      revokeRoleInput.addEventListener('change', () => {
        const processResponse = res => {
          dom.loading.style.opacity = '0';

          if (res.status === 200) {
            window.location = '/admin/users';
          }
        };

        const parameters = {
          checked: revokeRoleInput.checked,
          roleId: revokeRoleInput.dataset.id,
          userId: usersList.children[i].dataset.id
        };

        dom.loading.style.opacity = '1';
        kom.post('/api/user/update/role', parameters).then(processResponse).catch(processResponse);
      });
    }

    const deleteButton = usersList.children[i].querySelector('.delete-user');

    deleteButton.addEventListener('click', () => {
      const processResponse = res => {
        dom.loading.style.opacity = '0';

        if (res.status === 200) {
          window.location = '/admin/users';
        } else if (res.code === 'B_NEVER_KILL_ROOT') {
          dom.error.innerHTML = res.message;
        }
      };

      new ModalFactory('DeleteAccount', {
        url: '/template/modal/delete/user',
        cb: () => {
          const parameters = {
            userId: usersList.children[i].dataset.id
          };

          dom.loading.style.opacity = '1';
          kom.post('/api/user/delete', parameters).then(processResponse).catch(processResponse);
        }
      });
    });
  }

  lockRegistration.addEventListener('change', () => {
    const processResponse = res => {
      dom.loading.style.opacity = '0';

      if (res.status === 200) {
        window.location = '/admin/users';
      }
    };

    const parameters = {
      lockRegistration: lockRegistration.checked
    };

    dom.loading.style.opacity = '1';
    kom.post('/api/admin/update/settings', parameters).then(processResponse).catch(processResponse);
  });

  maxDepth.addEventListener('click', () => {
    const processResponse = res => {
      dom.loading.style.opacity = '0';

      if (res.status === 200) {
        window.location = '/admin/users';
      }
    };

    const parameters = {
      maxDepth: maxDepth.value
    };

    dom.loading.style.opacity = '1';
    kom.post('/api/admin/update/settings', parameters).then(processResponse).catch(processResponse);
  });
}


const saveArticle = document.querySelector('#save-article');
const publishArticle = document.querySelector('#publish-article');
if (saveArticle && publishArticle) {
  const dom = {
    error: document.querySelector('#error-output'),
    loading: document.querySelector('#line-loader')
  };

  const processResponse = res => {
    dom.loading.style.opacity = '0';

    if (res.status === 200) {
      window.location = res.url;
    }
  };

  saveArticle.addEventListener('click', () => {
    const parameters = {
      id: document.querySelector('#edit-article-id').value,
      title: document.querySelector('#edit-article-title').value,
      description: document.querySelector('#edit-article-description').value,
      content: document.querySelector('#edit-article-content').value
    };

    dom.loading.style.opacity = '1';
    kom.post('/api/admin/article/save', parameters).then(processResponse).catch(processResponse);
  });
}
