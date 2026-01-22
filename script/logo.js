// script/logo.js
// Gerencia carregamento da logomarca, preview, substituição do texto e persistência (localStorage)

const FILE_KEY = 'app_uploaded_logo_dataurl';

function initLogoUpload() {
  const fileInput = document.getElementById('seletorDeImagem');
  const sidebarImgPreview = document.getElementById('imagemCarregada');
  const loginBrandH1 = document.getElementById('login-brand');
  const sidebarTitleH1 = document.querySelector('.logo h1');

  if (!fileInput) return;

  // Cria um <img> com classes padrão
  function createImgElement(src, className, alt = 'Logomarca') {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = className;
    return img;
  }

  // Aplica a imagem na UI (sidebar + login)
  function applyLogo(dataUrl) {
    // Preview na sidebar (elemento já presente no HTML)
    if (sidebarImgPreview) {
      sidebarImgPreview.src = dataUrl;
      sidebarImgPreview.style.display = 'block';
    }

    // LOGIN: substitui texto do H1 por imagem (mantendo possibilidade de restauração)
    if (loginBrandH1) {
      // Guarda conteúdo original se ainda não guardado
      if (!loginBrandH1.dataset.originalHtml) {
        loginBrandH1.dataset.originalHtml = loginBrandH1.innerHTML;
      }

      // Remove todo o conteúdo textual/filhos e insere a imagem
      loginBrandH1.innerHTML = '';
      const img = createImgElement(dataUrl, 'login-brand-img', 'Logomarca');
      loginBrandH1.appendChild(img);
      // garante que o H1 continue visível (display) — estilização feita via CSS
      loginBrandH1.style.display = 'block';
    }

    // SIDEBAR: insere/atualiza imagem dentro do bloco .logo (ao lado/abaixo do H1)
    if (sidebarTitleH1) {
      // guarda texto original
      if (!sidebarTitleH1.dataset.originalHtml) {
        sidebarTitleH1.dataset.originalHtml = sidebarTitleH1.innerHTML;
      }

      // Tenta encontrar imagem já inserida
      let existingSidebarImg = sidebarTitleH1.parentNode.querySelector('img.sidebar-logo');
      if (existingSidebarImg) {
        existingSidebarImg.src = dataUrl;
        existingSidebarImg.style.display = 'block';
      } else {
        // insere a imagem depois do H1
        const img2 = createImgElement(dataUrl, 'sidebar-logo', 'Logomarca');
        sidebarTitleH1.parentNode.insertBefore(img2, sidebarTitleH1.nextSibling);
        // opcional: remover o texto do h1 para que a imagem ocupe o lugar visualmente
        sidebarTitleH1.textContent = '';
      }
    }
  }

  // Restaura (remove) a logomarca e devolve textos originais
  function removeLogo() {
    localStorage.removeItem(FILE_KEY);

    if (sidebarImgPreview) {
      sidebarImgPreview.src = '#';
      sidebarImgPreview.style.display = 'none';
    }

    if (loginBrandH1 && loginBrandH1.dataset.originalHtml) {
      loginBrandH1.innerHTML = loginBrandH1.dataset.originalHtml;
      delete loginBrandH1.dataset.originalHtml;
    }

    if (sidebarTitleH1) {
      // remove possível imagem sidebar
      const existingSidebarImg = sidebarTitleH1.parentNode.querySelector('img.sidebar-logo');
      if (existingSidebarImg) existingSidebarImg.remove();
      if (sidebarTitleH1.dataset.originalHtml) {
        sidebarTitleH1.innerHTML = sidebarTitleH1.dataset.originalHtml;
        delete sidebarTitleH1.dataset.originalHtml;
      }
    }
  }

  // Restaura do localStorage (se existir)
  const saved = localStorage.getItem(FILE_KEY);
  if (saved) {
    applyLogo(saved);
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      console.warn('Arquivo selecionado não é imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      try {
        localStorage.setItem(FILE_KEY, dataUrl);
      } catch (err) {
        console.warn('Não foi possível salvar logo no localStorage:', err);
      }
      applyLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  });

  // Disponibiliza função global de remoção (útil para debug ou botão "remover logomarca")
  window.__appLogo = {
    remove: removeLogo
  };
}

// Executa quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogoUpload);
} else {
  initLogoUpload();
}

export { initLogoUpload };