import os
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from time import sleep

# --- Configurações Iniciais ---

# Nome do seu arquivo de dados
NOME_ARQUIVO_CSV = r"C:\Users\giova\Downloads\exportacao_dados.csv"

# Caminho para o arquivo HTML principal da página CFEM
# Altere para o caminho correto no seu computador
NOME_ARQUIVO_HTML = r'C:\Users\giova\Downloads\CFEM ANM_files\CFEM ANM_files/CFEM ANM.html'
caminho_html_completo = os.path.abspath(NOME_ARQUIVO_HTML)

# --- Leitura dos Dados ---

# Carregar os dados do arquivo CSV
try:
    df = pd.read_csv(NOME_ARQUIVO_CSV)
except FileNotFoundError:
    print(f"Erro: O arquivo '{NOME_ARQUIVO_CSV}' não foi encontrado.")
    exit()

# --- Automação com Selenium ---

# Inicializar o driver do Chrome
# O Selenium vai procurar o chromedriver no mesmo diretório do script
driver = webdriver.Chrome()

# Abrir a página HTML local
driver.get(f"file:///{caminho_html_completo}")

# Iterar sobre cada linha do DataFrame (cada registro a ser preenchido)
for indice, linha in df.iterrows():
    print(f"Preenchendo registro {indice + 1}...")

    try:
        # --- Preenchimento dos Campos ---
        # ** IMPORTANTE: Substitua 'id_do_campo' pelos IDs reais dos campos do seu formulário HTML **

        # Exemplo de como preencher um campo de texto
        campo_processo = driver.find_element(By.ID, 'id_do_campo_processo_anm')
        campo_processo.clear()  # Limpa o campo antes de preencher
        campo_processo.send_keys(linha['processo_anm'])

        campo_municipio = driver.find_element(By.ID, 'id_do_campo_municipio')
        campo_municipio.clear()
        campo_municipio.send_keys(linha['municipio'])

        campo_mes_apuracao = driver.find_element(By.ID, 'id_do_campo_mes_apuracao')
        campo_mes_apuracao.clear()
        campo_mes_apuracao.send_keys(linha['mes_apuracao'])

        campo_valor_venda = driver.find_element(By.ID, 'id_do_campo_valor_venda')
        campo_valor_venda.clear()
        campo_valor_venda.send_keys(linha['valor_venda'])

        campo_quantidade = driver.find_element(By.ID, 'id_do_campo_quantidade')
        campo_quantidade.clear()
        campo_quantidade.send_keys(linha['quantidade'])

        # Exemplo para um campo de checkbox (se 'uso_imediato' for 'on')
        if linha['uso_imediato'] == 'on':
            checkbox_uso_imediato = driver.find_element(By.ID, 'id_do_checkbox_uso_imediato')
            if not checkbox_uso_imediato.is_selected():
                checkbox_uso_imediato.click()

        # Preencha os outros campos (pis, cofins, icms) da mesma forma
        campo_pis = driver.find_element(By.ID, 'id_do_campo_pis')
        campo_pis.clear()
        campo_pis.send_keys(linha['pis'])

        campo_cofins = driver.find_element(By.ID, 'id_do_campo_cofins')
        campo_cofins.clear()
        campo_cofins.send_keys(linha['cofins'])

        campo_icms = driver.find_element(By.ID, 'id_do_campo_icms')
        campo_icms.clear()
        campo_icms.send_keys(linha['icms'])

        # Pausa para visualizar o preenchimento
        sleep(2)

        # Se houver um botão de "Salvar" ou "Submeter" por registro
        # botao_salvar = driver.find_element(By.ID, 'id_do_botao_salvar')
        # botao_salvar.click()
        # sleep(2) # Espera após salvar

    except Exception as e:
        print(f"Ocorreu um erro ao preencher o registro {indice + 1}: {e}")
        # Decida se quer parar ou continuar para o próximo registro
        continue

# --- Finalização ---

print("Preenchimento concluído!")
# Mantém o navegador aberto por mais 10 segundos para você ver o resultado final
sleep(10)
driver.quit()