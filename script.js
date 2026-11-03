
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://sygajmruxwqqgmpsjizy.supabase.co";

// Coloque aqui sua chave Publishable
const SUPABASE_KEY = "sb_publishable_u5RyzDZ2ZQ2kuaTtoyTURQ_zrtpI_DT";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// VARIÁVEIS DOS GRÁFICOS
let graficoTemperatura;
let graficoVento;
let graficoChuva;

// CONVERTER GRAUS EM DIREÇÃO
function direcaoTexto(graus) {

    const direcoes = [
        "Norte",
        "Nordeste",
        "Leste",
        "Sudeste",
        "Sul",
        "Sudoeste",
        "Oeste",
        "Noroeste"
    ];

    const indice = Math.round(graus / 45) % 8;

    return direcoes[indice];
}

// CRIAR GRÁFICOS
function criarGrafico(elemento, titulo, dados, unidade) {

    return new Chart(
        document.getElementById(elemento),
        {
            type: "line",

            data: {
                labels: dados.map(item =>
                    new Date(item.data_hora).toLocaleTimeString("pt-BR")
                ),

                datasets: [{
                    label: titulo,
                    data: dados.map(item => item.valor),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        title: {
                            display: true,
                            text: unidade
                        }
                    }
                }
            }
        }
    );
}

// ATUALIZAR GRÁFICOS
function atualizarGrafico(grafico, dados) {

    grafico.data.labels = dados.map(item =>
        new Date(item.data_hora).toLocaleTimeString("pt-BR")
    );

    grafico.data.datasets[0].data =
        dados.map(item => item.valor);

    grafico.update();
}

// BUSCAR DADOS NO SUPABASE
async function carregarDados() {

    const status = document.getElementById("status");

    try {

        const { data, error } = await supabase
            .from("leituras_meteorologicas")
            .select("*")
            .order("data_hora", { ascending: false })
            .limit(24);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            status.textContent = "Aguardando leituras";

            return;
        }

        status.textContent = "● Conectado";

        const ultima = data[0];

        // ATUALIZAR INDICADORES

        document.getElementById("temperatura").textContent =
            Number(ultima.temperatura).toFixed(1) + " °C";

        document.getElementById("umidade").textContent =
            Number(ultima.umidade).toFixed(1) + " %";

        document.getElementById("vento").textContent =
            Number(ultima.velocidade_vento).toFixed(1) + " km/h";

        document.getElementById("direcao").textContent =
            direcaoTexto(Number(ultima.direcao_vento));

        document.getElementById("chuva").textContent =
            Number(ultima.chuva_mm).toFixed(2) + " mm";

        document.getElementById("dataHora").textContent =
            new Date(ultima.data_hora).toLocaleString("pt-BR");

        // ORGANIZAR LEITURAS PARA OS GRÁFICOS

        const leituras = [...data].reverse();

        const temperaturas = leituras.map(item => ({
            data_hora: item.data_hora,
            valor: item.temperatura
        }));

        const ventos = leituras.map(item => ({
            data_hora: item.data_hora,
            valor: item.velocidade_vento
        }));

        const chuvas = leituras.map(item => ({
            data_hora: item.data_hora,
            valor: item.chuva_mm
        }));

        // CRIAR OU ATUALIZAR GRÁFICOS

        if (!graficoTemperatura) {

            graficoTemperatura = criarGrafico(
                "graficoTemperatura",
                "Temperatura",
                temperaturas,
                "°C"
            );

            graficoVento = criarGrafico(
                "graficoVento",
                "Velocidade do vento",
                ventos,
                "km/h"
            );

            graficoChuva = criarGrafico(
                "graficoChuva",
                "Chuva",
                chuvas,
                "mm"
            );

        } else {

            atualizarGrafico(graficoTemperatura, temperaturas);

            atualizarGrafico(graficoVento, ventos);

            atualizarGrafico(graficoChuva, chuvas);
        }

    } catch (erro) {

        console.error("Erro ao carregar dados:", erro);

        status.textContent = "Erro na conexão";
    }
}

// INICIAR PAINEL
carregarDados();

// ATUALIZAR A CADA 15 SEGUNDOS
setInterval(carregarDados, 15000);
