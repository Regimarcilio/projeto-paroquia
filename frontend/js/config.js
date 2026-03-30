let siteConfig = {
    endereco: '',
    telefone: '',
    email: '',
    padroeiro: ''
};

async function carregarConfig() {
    try {
        const res = await fetch('/api/sobre/');
        const data = await res.json();
        if (data) {
            siteConfig.endereco = data.endereco || 'Rua Paulo Roberto Anastácio, 616 - Joinville/SC';
            siteConfig.telefone = data.telefone || '(47) 3463-7590';
            siteConfig.email = data.email || 'psec78@diocesejoinville.com.br';
            siteConfig.padroeiro = data.padroeiro || 'São Miguel Arcanjo';
        }
    } catch (e) {
        console.error('Erro ao carregar configurações:', e);
    }
}

function aplicarConfig() {
    const elementos = {
        'config-endereco': siteConfig.endereco,
        'config-telefone': siteConfig.telefone,
        'config-endereco-footer': siteConfig.endereco,
        'config-telefone-footer': siteConfig.telefone,
        'config-email-footer': siteConfig.email,
        'config-padroeiro': siteConfig.padroeiro
    };
    for (const [id, valor] of Object.entries(elementos)) {
        const el = document.getElementById(id);
        if (el) el.innerText = valor;
    }
}

// Executar
carregarConfig().then(() => aplicarConfig());