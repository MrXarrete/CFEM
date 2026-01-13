import pandas as pd
import time
import os
import threading
import base64
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

class CFEMAutomationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gerador Automático CFEM (PDF)")
        self.root.geometry("500x480")
        self.arquivo_csv = ""

        # --- Elementos da Interface ---
        self.lbl_arquivo = tk.Label(root, text="Nenhum arquivo selecionado", wraplength=480)
        self.lbl_arquivo.pack(pady=10)

        self.btn_select = tk.Button(root, text="1. Selecionar Arquivo CSV", command=self.selecionar_arquivo, bg="#dddddd")
        self.btn_select.pack(pady=5)

        tk.Label(root, text="--- Ações ---").pack(pady=10)

        self.btn_rascunho = tk.Button(root, text="2. Preencher e Salvar Rascunho (PDF)", 
                                      command=lambda: self.iniciar_thread("rascunho"), state=tk.DISABLED, bg="#add8e6")
        self.btn_rascunho.pack(pady=5, fill=tk.X, padx=50)

        self.btn_emitir = tk.Button(root, text="3. Emitir Boleto (PDF)", 
                                    command=lambda: self.iniciar_thread("emitir"), state=tk.DISABLED, bg="#90ee90")
        self.btn_emitir.pack(pady=5, fill=tk.X, padx=50)

        self.log_text = scrolledtext.ScrolledText(root, height=10, state='disabled')
        self.log_text.pack(pady=10, padx=10, fill=tk.BOTH, expand=True)

    def log(self, mensagem):
        """Escreve na caixa de texto da interface."""
        self.log_text.config(state='normal')
        self.log_text.insert(tk.END, mensagem + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')
        print(mensagem)

    def seleciona_arquivo(self):
        filename = filedialog.askopenfilename(title="Selecione o CSV", filetypes=[("Arquivos CSV", "*.csv")])
        if filename:
            self.arquivo_csv = filename
            self.lbl_arquivo.config(text=f"Arquivo: {os.path.basename(filename)}")
            self.btn_rascunho.config(state=tk.NORMAL)
            self.btn_emitir.config(state=tk.NORMAL)
            self.log(f"Arquivo selecionado: {filename}")

    def selecionar_arquivo(self):
        filename = filedialog.askopenfilename(title="Selecione o CSV", filetypes=[("Arquivos CSV", "*.csv")])
        if filename:
            self.arquivo_csv = filename
            self.lbl_arquivo.config(text=f"Arquivo: {os.path.basename(filename)}")
            self.btn_rascunho.config(state=tk.NORMAL)
            self.btn_emitir.config(state=tk.NORMAL)
            self.log(f"Arquivo selecionado: {filename}")

    def iniciar_thread(self, modo):
        """Roda a automação em segundo plano."""
        self.btn_rascunho.config(state=tk.DISABLED)
        self.btn_emitir.config(state=tk.DISABLED)
        self.btn_select.config(state=tk.DISABLED)
        
        thread = threading.Thread(target=self.executar_automacao, args=(modo,))
        thread.start()

    def digitar_lentamente(self, elemento, texto):
        for caractere in str(texto):
            elemento.send_keys(caractere)
            time.sleep(0.05)

    def salvar_como_pdf(self, driver, nome_arquivo):
        """Gera um PDF usando o DevTools Protocol do Chrome."""
        try:
            # Configurações do PDF (A4, manter background, etc)
            pdf_params = {
                "landscape": False,
                "displayHeaderFooter": False,
                "printBackground": True, # Importante para manter cores do boleto
                #"paperWidth": 8.27,  # Polegadas (A4)
                #"paperHeight": 11.7, # Polegadas (A4)
            }
            
            # Comando direto ao Chrome para gerar o PDF em Base64
            result = driver.execute_cdp_cmd("Page.printToPDF", pdf_params)
            
            # Decodifica e salva em arquivo
            with open(nome_arquivo, "wb") as f:
                f.write(base64.b64decode(result['data']))
                
            self.log(f" -> PDF salvo: {nome_arquivo}")
        except Exception as e:
            self.log(f" -> Erro ao salvar PDF: {e}")

    def executar_automacao(self, modo):
        self.log(f"\n--- Iniciando modo: {modo.upper()} ---")
        driver = None
        try:
            df = pd.read_csv(self.arquivo_csv, encoding='utf-8', dtype=str, sep=';')
            df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)
            df.fillna('', inplace=True)

            servico = Service(ChromeDriverManager().install())
            options = webdriver.ChromeOptions()
            options.add_argument("--start-maximized")
            # options.add_argument("--headless") # Se quiser rodar invisível, descomente aqui
            
            driver = webdriver.Chrome(service=servico, options=options)
            wait = WebDriverWait(driver, 20)
            short_wait = WebDriverWait(driver, 5)

            url = "https://app.anm.gov.br/BoletosCfem/NaoDivida/Cfem"

            for index, row in df.iterrows():
                proc = row.get('numero_processo', 'N/A')
                self.log(f"Processando linha {index + 1}: {proc}")
                
                try:
                    driver.get(url)

                    # --- ETAPA 1: DADOS CADASTRAIS ---
                    cpf_cnpj_input = wait.until(EC.presence_of_element_located((By.ID, "cpfCnpj")))
                    cpf_cnpj_input.clear()
                    self.digitar_lentamente(cpf_cnpj_input, row['cpf_cnpj']) 
                    driver.find_element(By.TAG_NAME, 'header').click()
                    
                    wait.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='cbProcesso']/option[contains(text(), \"{row['numero_processo']}\")]")))
                    Select(driver.find_element(By.ID, "cbProcesso")).select_by_visible_text(row['numero_processo'])
                    
                    wait.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='cbSubstancia']/option[contains(text(), \"{row['substancia']}\")]")))
                    Select(driver.find_element(By.ID, "cbSubstancia")).select_by_visible_text(row['substancia'])

                    wait.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='cbUnidadeMedida']/option[contains(text(), \"{row['unidade_medida']}\")]")))
                    Select(driver.find_element(By.ID, "cbUnidadeMedida")).select_by_visible_text(row['unidade_medida'])

                    wait.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='cbMunicipio']/option[contains(text(), \"{row['municipio']}\")]")))
                    Select(driver.find_element(By.ID, "cbMunicipio")).select_by_visible_text(row['municipio'])

                    mes_input = wait.until(EC.presence_of_element_located((By.ID, "mesApuracao")))
                    driver.execute_script("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input'));", mes_input, row['mes_apuracao'])
                    driver.find_element(By.TAG_NAME, 'header').click()

                    # --- ETAPA 2: FATOS GERADORES ---
                    def preencher_se_existe(id_valor, id_qtd, id_ncm, valor_csv, qtd_csv, ncm_csv):
                        if valor_csv and valor_csv not in ['0', '0,00']:
                            try:
                                elem_valor = short_wait.until(EC.visibility_of_element_located((By.ID, id_valor)))
                                elem_valor.clear()
                                elem_valor.send_keys(valor_csv)

                                elem_qtd = driver.find_element(By.ID, id_qtd)
                                elem_qtd.clear()
                                elem_qtd.send_keys(qtd_csv)

                                if ncm_csv:
                                    elem_ncm = driver.find_element(By.ID, id_ncm)
                                    elem_ncm.clear()
                                    elem_ncm.click()
                                    ncm_limpo = ncm_csv.replace('.', '').strip()
                                    self.digitar_lentamente(elem_ncm, ncm_limpo)
                                
                                driver.find_element(By.TAG_NAME, 'header').click()
                                time.sleep(1)
                                try:
                                    WebDriverWait(driver, 2).until(EC.alert_is_present())
                                    driver.switch_to.alert.accept()
                                except TimeoutException: pass
                            except Exception: pass

                    preencher_se_existe("valorVendaMercadoInterno", "qtdVendaMercadoInterno", "codigoNCMMinterno", 
                                        row.get('valor_venda_interno'), row.get('qtd_venda_interno'), row.get('ncm_interno'))

                    # --- ETAPA 3: DEDUÇÕES ---
                    campos_deducao = {'icms': 'icms', 'pis': 'pis', 'cofins': 'cofins', 'frete': 'frete', 'seguro': 'seguro'}
                    for col_csv, id_html in campos_deducao.items():
                        valor = row.get(col_csv)
                        if valor and valor not in ['0', '0,00']:
                            try:
                                elem = driver.find_element(By.ID, id_html)
                                elem.clear()
                                elem.send_keys(valor)
                            except NoSuchElementException: pass

                    # --- ETAPA 4: CALCULAR ---
                    calcular_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Calcular Valor')]")))
                    driver.execute_script("arguments[0].scrollIntoView(); arguments[0].click();", calcular_btn)
                    time.sleep(3) 

                    # --- ETAPA 5: DECISÃO DE MODO ---
                    proc_limpo = str(row['numero_processo']).replace("/", "-").replace(".", "")
                    
                    if modo == "rascunho":
                        self.salvar_como_pdf(driver, f"Rascunho_{index+1}_{proc_limpo}.pdf")
                        self.log(f"Rascunho PDF salvo para linha {index+1}")

                    elif modo == "emitir":
                        try:
                            emitir_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Emitir guia de recolhimento')]")))
                            driver.execute_script("arguments[0].click();", emitir_btn)
                            self.log("Botão emitir clicado. Aguardando janela do boleto...")
                            time.sleep(5)

                            janelas = driver.window_handles
                            if len(janelas) > 1:
                                driver.switch_to.window(janelas[-1])
                                time.sleep(3) # Tempo para renderizar o boleto
                                self.salvar_como_pdf(driver, f"Boleto_{index+1}_{proc_limpo}.pdf")
                                driver.close()
                                driver.switch_to.window(janelas[0])
                                self.log(f"Boleto PDF emitido para linha {index+1}")
                            else:
                                self.log("Erro: Nova janela não abriu.")
                        except Exception as e:
                            self.log(f"Erro ao clicar em emitir: {e}")

                except Exception as e:
                    self.log(f"Erro na linha {index+1}: {e}")

            self.log("--- Processamento Finalizado ---")
            messagebox.showinfo("Sucesso", f"Processo {modo} finalizado!")

        except Exception as e:
            self.log(f"Erro Geral: {e}")
            messagebox.showerror("Erro", str(e))
        finally:
            self.btn_select.config(state=tk.NORMAL)
            self.btn_rascunho.config(state=tk.NORMAL)
            self.btn_emitir.config(state=tk.NORMAL)
            if driver:
                driver.quit()

if __name__ == "__main__":
    root = tk.Tk()
    app = CFEMAutomationApp(root)
    root.mainloop()