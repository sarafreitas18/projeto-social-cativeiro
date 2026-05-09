import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDa4Ep2cebafM5gMfsZ7B0GHtYbrp-1jF8",
  authDomain: "sistema-ong-cativeiro.firebaseapp.com",
  projectId: "sistema-ong-cativeiro",
  storageBucket: "sistema-ong-cativeiro.firebasestorage.app",
  messagingSenderId: "394663192159",
  appId: "1:394663192159:web:db3fa58427672c61901dea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
/**
 * Script do Projeto Social Cativeiro
 * Gerencia navegação, autenticação e dados mockados
 */

// --- DADOS INICIAIS (MOCK) ---
const INITIAL_FAMILIES = [
    {
        id: '1',
        responsibleName: 'Maria Silva Oliveira',
        birthDate: '1985-05-15',
        gender: 'F',
        maritalStatus: 'Solteira',
        phone: '(11) 98765-4321',
        address: 'Rua das Flores, 123',
        neighborhood: 'Jardim Alvorada',
        referencePoint: 'Próximo ao mercadinho do Zé',
        reasonForAssistance: 'Desemprego e vulnerabilidade alimentar',
        rg: '12.345.678-9',
        cpf: '123.456.789-00',
        nisNumber: '123.456.789.10',
        professionalSituation: 'Desempregada',
        housingType: 'Alugada',
        numberOfRooms: 3,
        constructionType: 'Alvenaria',
        monthlyExpenses: 1200,
        observations: 'Família necessita de acompanhamento prioritário.',
        createdAt: '2024-04-10T10:00:00Z',
        members: [
            { name: 'Pedro Silva Oliveira', relationship: 'Filho', birthDate: '2015-08-20' },
            { name: 'Ana Silva Oliveira', relationship: 'Filha', birthDate: '2018-03-12' }
        ]
    },
    {
        id: '2',
        responsibleName: 'João Pereira dos Santos',
        birthDate: '1978-11-22',
        gender: 'M',
        maritalStatus: 'Casado',
        phone: '(11) 91234-5678',
        address: 'Av. Brasil, 456',
        neighborhood: 'Vila Esperança',
        referencePoint: 'Em frente à escola municipal',
        reasonForAssistance: 'Baixa renda familiar',
        rg: '23.456.789-0',
        cpf: '234.567.890-11',
        nisNumber: '234.567.890.11',
        professionalSituation: 'Autônomo',
        housingType: 'Própria',
        numberOfRooms: 4,
        constructionType: 'Alvenaria',
        monthlyExpenses: 800,
        observations: 'Família com 3 filhos em idade escolar.',
        createdAt: '2024-05-01T09:30:00Z',
        members: [
            { name: 'Carla dos Santos', relationship: 'Esposa', birthDate: '1982-01-10' }
        ]
    }
];

// Instância de dados
let families = [];
let currentRegistrationMembers = [];

// --- SELETORES ---
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const sections = document.querySelectorAll('.section-content');
const navItems = document.querySelectorAll('.nav-item, .nav-trigger');
const familiesTableBody = document.getElementById('families-table-body');
const recentFamiliesList = document.getElementById('recent-families-list');
const statFamilies = document.getElementById('stat-families');
const statChildren = document.getElementById('stat-children');

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Verificar Auth
    if (localStorage.getItem('cativeiro_logged') === 'true') {
        showApp();
    }

    // Inicializar Ícones
    lucide.createIcons();

    loadFamilies();
});

async function loadFamilies() {
    const querySnapshot = await getDocs(collection(db, "familias"));

    families = [];

    querySnapshot.forEach((doc) => {
        families.push({
            id: doc.id,
            ...doc.data()
        });
    });

    updateStats();
    renderFamilies();
    renderRecentFamilies();
}

// --- AUTENTICAÇÃO ---
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = 'Verificando...';
    btn.disabled = true;

    setTimeout(() => {
        localStorage.setItem('cativeiro_logged', 'true');
        showApp();
    }, 1000);
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('cativeiro_logged');
    location.reload();
});

function showApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    mainApp.classList.add('flex');
}

// --- NAVEGAÇÃO ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.getAttribute('data-section');
        if (!sectionId) return;

        // Atualizar Menu Ativo
        navItems.forEach(nav => nav.classList.remove('active'));
        const sidebarNav = document.querySelector(`aside .nav-item[data-section="${sectionId}"]`);
        if (sidebarNav) sidebarNav.classList.add('active');

        // Alternar Seções
        sections.forEach(sec => sec.classList.add('hidden'));
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Caso especial: fechar menu mobile ao navegar
        // (Seria implementado aqui se houvesse toggle mobile)
    });
});

// --- ABAS (TABS) ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        
        // Ativar Botão
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Mostrar Conteúdo
        btn.closest('.bento-card').querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById(targetTabId).classList.remove('hidden');
    });
});

// --- GERENCIAMENTO DE FAMÍLIAS ---

function updateStats() {
    statFamilies.innerText = families.length;
    let childrenCount = 0;
    families.forEach(f => {
        childrenCount += f.members.filter(m => {
            const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
            return age < 18;
        }).length;
    });
    statChildren.innerText = childrenCount;
}

function renderFamilies() {
    if (!familiesTableBody) return;
    
    familiesTableBody.innerHTML = families.map(f => `
        <tr class="group hover:bg-emerald-50/30 border-t border-slate-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                        ${f.responsibleName.charAt(0)}
                    </div>
                    <div>
                        <p class="font-bold text-sm text-slate-800">${f.responsibleName}</p>
                        <p class="text-[10px] text-slate-400 font-medium">CPF: ${f.cpf || '---'}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-xs font-semibold text-slate-600">${f.neighborhood}</td>
            <td class="px-6 py-4 text-xs font-mono text-slate-400">${f.nisNumber || '---'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewFamily('${f.id}')" class="p-2 text-slate-400 hover:text-blue-600 transition-colors"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>
                <button onclick="deleteFamily('${f.id}')" class="p-2 text-slate-400 hover:text-rose-500 transition-colors"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function renderRecentFamilies() {
    if (!recentFamiliesList) return;
    
    recentFamiliesList.innerHTML = families.slice(0, 4).map(f => `
        <div onclick="viewFamily('${f.id}')" class="flex items-center justify-between p-4 border border-slate-50 rounded-xl hover:bg-slate-50 hover:border-blue-100 transition-all cursor-pointer group mb-3">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    ${f.responsibleName.charAt(0)}
                </div>
                <div>
                    <p class="font-bold text-slate-800 text-sm">${f.responsibleName}</p>
                    <div class="flex gap-2 mt-1">
                        <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded font-bold">NIS: ${f.nisNumber || '---'}</span>
                        <span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] rounded font-bold uppercase tracking-tight">${f.neighborhood}</span>
                    </div>
                </div>
            </div>
            <i data-lucide="chevron-right" class="text-slate-200 group-hover:text-blue-600 transition-colors"></i>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// --- CADASTRO ---

document.getElementById('add-member-btn').addEventListener('click', () => {
    const name = document.getElementById('member-name').value;
    const relation = document.getElementById('member-relation').value;

    if (!name || !relation) return;

    currentRegistrationMembers.push({ name, relationship: relation, birthDate: '2000-01-01' });
    document.getElementById('member-name').value = '';
    document.getElementById('member-relation').value = '';
    renderMembersInForm();
});

function renderMembersInForm() {
    const body = document.getElementById('members-list-body');
    body.innerHTML = currentRegistrationMembers.map((m, index) => `
        <tr class="border-t">
            <td class="px-4 py-3">${m.name}</td>
            <td class="px-4 py-3 text-slate-500">${m.relationship}</td>
            <td class="px-4 py-3 text-right">
                <button type="button" onclick="removeMemberFromForm(${index})" class="text-rose-500 font-bold text-[10px] uppercase">Remover</button>
            </td>
        </tr>
    `).join('');
}

window.removeMemberFromForm = (index) => {
    currentRegistrationMembers.splice(index, 1);
    renderMembersInForm();
};

document.getElementById('save-family-btn').addEventListener('click', async () => {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);
    
    if (!formData.get('responsibleName')) {
        alert('Nome do responsável é obrigatório!');
        return;
    }

    const newFamily = {
        id: Date.now().toString(),
        responsibleName: formData.get('responsibleName'),
        birthDate: formData.get('birthDate'),
        gender: formData.get('gender'),
        phone: formData.get('phone'),
        rg: formData.get('rg'),
        cpf: formData.get('cpf'),
        nisNumber: formData.get('nis'),
        address: formData.get('address'),
        neighborhood: formData.get('neighborhood'),
        professionalSituation: formData.get('job'),
        housingType: formData.get('housing'),
        monthlyExpenses: parseFloat(formData.get('income')) || 0,
        observations: formData.get('notes'),
        members: [...currentRegistrationMembers],
        createdAt: new Date().toISOString()
    };

    families.unshift(newFamily);
    await addDoc(collection(db, "familias"), newFamily);
    
    // Reset
    form.reset();
    currentRegistrationMembers = [];
    renderMembersInForm();
    
    // Feedback e Navegação
    alert('Família cadastrada com sucesso!');
    updateStats();
    renderFamilies();
    renderRecentFamilies();
    document.querySelector('.nav-item[data-section="list"]').click();
});

// --- VISUALIZAÇÃO ---

window.viewFamily = (id) => {
    const family = families.find(f => f.id === id);
    if (!family) return;

    const detailsSection = document.getElementById('section-details');
    detailsSection.innerHTML = `
        <div class="flex items-center justify-between print:hidden">
            <div class="flex items-center gap-4">
                <button onclick="document.querySelector('.nav-item[data-section=\\'list\\']').click()" class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 class="text-2xl font-bold">Ficha de Acompanhamento</h2>
            </div>
            <div class="flex gap-2">
                <button onclick="window.print()" class="h-10 px-6 rounded-xl border border-slate-200 font-bold text-xs uppercase flex items-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Imprimir</button>
                <button class="btn-primary h-10 px-6 rounded-xl text-xs uppercase flex items-center gap-2"><i data-lucide="edit" class="w-4 h-4"></i> Editar</button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Coluna Perfil -->
            <div class="space-y-6">
                <div class="bento-card overflow-hidden">
                    <div class="h-2 bg-blue-600"></div>
                    <div class="p-6 text-center">
                        <div class="w-24 h-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold mx-auto mb-4">
                            ${family.responsibleName.charAt(0)}
                        </div>
                        <h3 class="text-lg font-bold text-slate-800">${family.responsibleName}</h3>
                        <p class="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">${family.professionalSituation || 'Sem registro'}</p>
                    </div>
                </div>

                <div class="bento-card p-5 space-y-4">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contatos e Local</h4>
                    <div class="flex gap-3 text-sm">
                        <i data-lucide="phone" class="w-4 h-4 text-blue-600"></i>
                        <span class="text-slate-600">${family.phone || 'N/A'}</span>
                    </div>
                    <div class="flex gap-3 text-sm border-t pt-4">
                        <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i>
                        <span class="text-slate-600 leading-snug">${family.address}, ${family.neighborhood}</span>
                    </div>
                </div>
            </div>

            <!-- Coluna Detalhes -->
            <div class="md:col-span-2 space-y-6">
                <div class="bento-card p-6">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Informações Socioeconômicas</h4>
                    <div class="grid grid-cols-2 gap-y-6">
                        <div>
                            <p class="text-[9px] uppercase font-bold text-slate-400">CPF / RG</p>
                            <p class="text-sm font-semibold">${family.cpf || '---'} / ${family.rg || '---'}</p>
                        </div>
                        <div>
                            <p class="text-[9px] uppercase font-bold text-slate-400">Número NIS</p>
                            <p class="text-sm font-mono font-bold">${family.nisNumber || '---'}</p>
                        </div>
                        <div>
                            <p class="text-[9px] uppercase font-bold text-slate-400">Moradia</p>
                            <p class="text-sm font-semibold">${family.housingType || '---'}</p>
                        </div>
                        <div>
                            <p class="text-[9px] uppercase font-bold text-slate-400">Gasto Estimado</p>
                            <p class="text-sm font-bold text-emerald-600">R$ ${family.monthlyExpenses.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div class="bento-card p-6">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Composição Familiar</h4>
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-slate-400 border-b">
                                <th class="pb-3 text-[10px] uppercase">Membro</th>
                                <th class="pb-3 text-[10px] uppercase">Parentesco</th>
                                <th class="pb-3 text-[10px] uppercase">Nascimento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${family.members.length > 0 ? family.members.map(m => `
                                <tr class="border-b border-slate-50">
                                    <td class="py-3 font-semibold text-slate-700">${m.name}</td>
                                    <td class="py-3 text-slate-500">${m.relationship}</td>
                                    <td class="py-3 text-slate-500">${m.birthDate}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="py-4 text-center text-slate-400 italic font-medium">Nenhum membro registrado.</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div class="bento-card p-6 bg-slate-50/50">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Observações Adicionais</h4>
                    <p class="text-sm text-slate-600 leading-relaxed italic">
                        "${family.observations || 'Nenhuma observação registrada para este cadastro.'}"
                    </p>
                </div>
            </div>
        </div>

        <div class="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold pt-8 border-t hidden print:block">
            Documento Emitido em ${new Date().toLocaleString('pt-BR')} • Projeto Social Cativeiro
        </div>
    `;

    // Navegar
    sections.forEach(sec => sec.classList.add('hidden'));
    detailsSection.classList.remove('hidden');
    lucide.createIcons();
};

window.deleteFamily = (id) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este cadastro?')) return;
    
    families = families.filter(f => f.id !== id);
    
    updateStats();
    renderFamilies();
    renderRecentFamilies();
};
