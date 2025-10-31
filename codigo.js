document.addEventListener('DOMContentLoaded', () => {
    
    const inputTitulo = document.getElementById('inputTitulo');
    const inputDescricao = document.getElementById('inputDescricao');
    const inputDataConclusao = document.getElementById('inputDataConclusao');
    const inputHoraConclusao = document.getElementById('inputHoraConclusao');
    const selectPrioridade = document.getElementById('selectPrioridade');
    const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
    const containerNotasAdesivas = document.getElementById('containerNotasAdesivas');
    const secaoFiltros = document.querySelector('.secao-filtros');
    const containerPaginacao = document.getElementById('containerPaginacao');
    
    const CORES_PALETA = ['#ffef8a', '#d0f4de', '#ffc7c7', '#c7d5ff', '#e9c7ff'];
    
    const NOTAS_POR_PAGINA = 8; 
    let paginaAtual = 1;
    let filtroAtual = 'todos'; 

    let alarmesDisparadosHoje = [];

    document.addEventListener('click', (e) => {
        const paletasAtivas = document.querySelectorAll('.nota-paleta-cores.ativa');
        
        paletasAtivas.forEach(paleta => {
            if (!paleta.contains(e.target)) {
                paleta.classList.remove('ativa');
            }
        });
    });
    
    function solicitarPermissaoNotificacao() {
        if (!("Notification" in window)) {
            console.warn("Este navegador não suporta notificações de desktop.");
        }
        else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    function carregarTarefas() {
        const tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];
        tarefas.forEach(tarefa => criarNotaAdesiva(tarefa));
        
        aplicarFiltroEPaginacao(); 
    }

    function salvarTarefas() {
        const notas = document.querySelectorAll('.nota-adesiva');
        const tarefas = [];
        notas.forEach(nota => {
            tarefas.push({
                id: nota.id,
                titulo: nota.querySelector('.nota-titulo').textContent,
                descricao: nota.querySelector('.nota-descricao').textContent,
                data: nota.dataset.data,
                hora: nota.dataset.hora, 
                prioridade: nota.dataset.prioridade,
                cor: nota.style.backgroundColor,
                concluida: nota.classList.contains('nota-concluida')
            });
        });
        localStorage.setItem('tarefas', JSON.stringify(tarefas));
    }

    function formatarDataHora(dataString, horaString) {
        let dataFormatada = '';
        if (dataString && dataString !== '') {
            const [ano, mes, dia] = dataString.split('-');
            dataFormatada = `${dia}/${mes}/${ano}`;
        }

        let horaFormatada = '';
        if (horaString && horaString !== '') {
            horaFormatada = horaString;
        }

        if (dataFormatada && horaFormatada) {
            return `${dataFormatada} às ${horaFormatada}`;
        } else if (dataFormatada) {
            return dataFormatada;
        } else if (horaFormatada) {
            return `Às ${horaFormatada}`;
        }
        
        return 'Sem data';
    }
    
    function adicionarEventoEdicao(elemento) {
        elemento.addEventListener('dblclick', () => {
            if (elemento.closest('.nota-adesiva').classList.contains('nota-concluida')) {
                return;
            }

            const valorAtual = elemento.textContent;
            const areaDeEdicao = document.createElement('textarea');
            areaDeEdicao.value = valorAtual;
            
            areaDeEdicao.className = elemento.className; 
            areaDeEdicao.style.height = `${elemento.offsetHeight + 10}px`;

            elemento.replaceWith(areaDeEdicao);
            areaDeEdicao.focus();

            const salvarEdicao = () => {
                elemento.textContent = areaDeEdicao.value.trim();
                areaDeEdicao.replaceWith(elemento);
                salvarTarefas(); 
            };

            areaDeEdicao.addEventListener('blur', salvarEdicao);
            areaDeEdicao.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    areaDeEdicao.blur();
                }
            });
        });
    }

    function criarNotaAdesiva(tarefa) {
        const notaAdesiva = document.createElement('div');
        notaAdesiva.id = tarefa.id || `nota-${Date.now()}`;
        notaAdesiva.className = 'nota-adesiva';
        notaAdesiva.dataset.prioridade = tarefa.prioridade;
        notaAdesiva.dataset.data = tarefa.data || '';
        notaAdesiva.dataset.hora = tarefa.hora || '';

        notaAdesiva.style.backgroundColor = tarefa.cor || (tarefa.prioridade === 'high' ? '#ffc7c7' : tarefa.prioridade === 'medium' ? '#ffef8a' : '#d0f4de');
        
        if (tarefa.concluida) {
            notaAdesiva.classList.add('nota-concluida');
        }
        
        notaAdesiva.style.display = 'none'; 

        const elementoTitulo = document.createElement('h3');
        elementoTitulo.className = 'nota-titulo';
        elementoTitulo.textContent = tarefa.titulo;

        const elementoDescricao = document.createElement('p');
        elementoDescricao.className = 'nota-descricao';
        elementoDescricao.textContent = tarefa.descricao;

        const rodape = document.createElement('div');
        rodape.className = 'nota-rodape';
        
        const rodapeEsquerda = document.createElement('div');
        rodapeEsquerda.className = 'nota-rodape-esquerda';

        const checkboxConcluido = document.createElement('input');
        checkboxConcluido.type = 'checkbox';
        checkboxConcluido.className = 'btn-concluir-nota';
        checkboxConcluido.checked = tarefa.concluida || false;
        checkboxConcluido.title = "Marcar como concluída";

        checkboxConcluido.addEventListener('change', () => {
            notaAdesiva.classList.toggle('nota-concluida', checkboxConcluido.checked);
            salvarTarefas();
        });

        const elementoData = document.createElement('span');
        elementoData.className = 'nota-data';
        elementoData.textContent = formatarDataHora(tarefa.data, tarefa.hora); 

        rodapeEsquerda.appendChild(checkboxConcluido);
        rodapeEsquerda.appendChild(elementoData);

        const botaoDeletar = document.createElement('button');
        botaoDeletar.textContent = 'X';
        botaoDeletar.className = 'btn-deletar-nota';

        const paletaCores = document.createElement('div');
        paletaCores.className = 'nota-paleta-cores';

        const triggerPaleta = document.createElement('div');
        triggerPaleta.className = 'paleta-trigger';
        triggerPaleta.innerHTML = '🎨';
        triggerPaleta.title = "Mudar cor";
        
        triggerPaleta.addEventListener('click', (e) => {
            e.stopPropagation();
            paletaCores.classList.toggle('ativa');
        });
        
        paletaCores.appendChild(triggerPaleta);

        CORES_PALETA.forEach(cor => {
            const corOpcao = document.createElement('div');
            corOpcao.className = 'cor-opcao';
            corOpcao.style.backgroundColor = cor;
            corOpcao.addEventListener('click', (e) => {
                e.stopPropagation();
                if (notaAdesiva.classList.contains('nota-concluida')) return; 
                notaAdesiva.style.backgroundColor = cor;
                salvarTarefas();
                paletaCores.classList.remove('ativa');
            });
            paletaCores.appendChild(corOpcao);
        });
        
        rodape.appendChild(rodapeEsquerda); 
        rodape.appendChild(paletaCores);
        
        notaAdesiva.appendChild(botaoDeletar);
        notaAdesiva.appendChild(elementoTitulo);
        notaAdesiva.appendChild(elementoDescricao);
        notaAdesiva.appendChild(rodape);
        
        containerNotasAdesivas.appendChild(notaAdesiva);

        
        botaoDeletar.onclick = () => {
            containerNotasAdesivas.removeChild(notaAdesiva);
            salvarTarefas();
            
            const todasAsNotas = document.querySelectorAll('.nota-adesiva');
            const notasFiltradas = Array.from(todasAsNotas).filter(n => filtroAtual === 'todos' || n.dataset.prioridade === filtroAtual);
            const totalPaginas = Math.ceil(notasFiltradas.length / NOTAS_POR_PAGINA);
            
            if (paginaAtual > totalPaginas && totalPaginas > 0) {
                paginaAtual = totalPaginas;
            } else if (notasFiltradas.length === 0) {
                paginaAtual = 1;
            }

            aplicarFiltroEPaginacao();
        };

        adicionarEventoEdicao(elementoTitulo);
        adicionarEventoEdicao(elementoDescricao);
    }
    
    function aplicarFiltroEPaginacao() {
        const todasAsNotas = document.querySelectorAll('.nota-adesiva');
        let notasFiltradas = [];

        todasAsNotas.forEach(nota => {
            const passaNoFiltro = (filtroAtual === 'todos' || nota.dataset.prioridade === filtroAtual);
            
            if (passaNoFiltro) {
                notasFiltradas.push(nota);
            }
            nota.style.display = 'none'; 
        });

        const totalPaginas = Math.ceil(notasFiltradas.length / NOTAS_POR_PAGINA);
        const indiceInicio = (paginaAtual - 1) * NOTAS_POR_PAGINA;
        const indiceFim = paginaAtual * NOTAS_POR_PAGINA;
        
        const notasDaPagina = notasFiltradas.slice(indiceInicio, indiceFim);
        
        notasDaPagina.forEach(nota => {
            nota.style.display = 'flex';
        });

        renderizarBotoesPaginacao(totalPaginas);
    }

    function renderizarBotoesPaginacao(totalPaginas) {
        containerPaginacao.innerHTML = '';
        if (totalPaginas <= 1) return;

        for (let i = 1; i <= totalPaginas; i++) {
            const botaoPagina = document.createElement('button');
            botaoPagina.className = 'pagina-btn';
            botaoPagina.textContent = i;
            if (i === paginaAtual) {
                botaoPagina.classList.add('pagina-ativa');
            }
            
            botaoPagina.addEventListener('click', () => {
                paginaAtual = i;
                aplicarFiltroEPaginacao();
            });
            
            containerPaginacao.appendChild(botaoPagina);
        }
    }

    function obterDataHoraAtual() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        
        return {
            data: `${ano}-${mes}-${dia}`,
            hora: `${hora}:${minuto}`
        };
    }

    function mostrarNotificacaoDeTela(tarefa) {
        if (Notification.permission !== "granted") {
            console.warn("Permissão de notificação não concedida. Solicitando novamente.");
            Notification.requestPermission();
            return; 
        }

        const options = {
            body: `Sua tarefa "${tarefa.titulo}" está agendada para hoje às ${tarefa.hora}.\n${tarefa.descricao || ''}`,
        };

        const notificacao = new Notification("🔔 Lembrete de Tarefa!", options);

        notificacao.onclick = () => {
            window.focus();
        };
    }

    function verificarAlarmes() {
        const { data: dataAtual, hora: horaAtual } = obterDataHoraAtual();
        const tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];

        tarefas.forEach(tarefa => {
            if (tarefa.data && tarefa.data === dataAtual && 
                tarefa.hora && tarefa.hora === horaAtual && 
                !alarmesDisparadosHoje.includes(tarefa.id) && 
                !tarefa.concluida) {
                
                console.log(`Disparando notificação de tela para: ${tarefa.titulo} às ${tarefa.hora}`);
                mostrarNotificacaoDeTela(tarefa);
                alarmesDisparadosHoje.push(tarefa.id); 
            }
        });
    }

    botaoAdicionarTarefa.addEventListener('click', () => {
        if (inputTitulo.value.trim() === "") {
            alert("Por favor, digite um título para a tarefa!");
            return;
        }

        const novaTarefa = {
            titulo: inputTitulo.value.trim(),
            descricao: inputDescricao.value.trim(),
            data: inputDataConclusao.value,
            hora: inputHoraConclusao.value,
            prioridade: selectPrioridade.value,
            concluida: false
        };

        criarNotaAdesiva(novaTarefa);
        salvarTarefas();

        paginaAtual = 1; 
        aplicarFiltroEPaginacao(); 

        inputTitulo.value = '';
        inputDescricao.value = '';
        inputDataConclusao.value = '';
        inputHoraConclusao.value = '';
        inputTitulo.focus();
    });
    
    secaoFiltros.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;

        document.querySelector('.filtro-btn.filtro-ativo').classList.remove('filtro-ativo');
        e.target.classList.add('filtro-ativo');

        filtroAtual = e.target.dataset.filtro;
        paginaAtual = 1; 
        
        aplicarFiltroEPaginacao();
    });

    carregarTarefas();
    solicitarPermissaoNotificacao(); 
    verificarAlarmes(); 
    setInterval(verificarAlarmes, 60000); 
});